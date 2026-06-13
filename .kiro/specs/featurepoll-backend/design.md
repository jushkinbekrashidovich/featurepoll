# Design Document

## Overview

This design covers the FeaturePoll backend: Postgres schema (with RLS), Edge Functions (Deno/TypeScript), publishable key validation, rate limiting, and seed data. The backend is the single source of truth consumed by the Flutter SDK, future SDKs, and the web dashboard.

All database objects live in numbered SQL migration files under `/backend/migrations/`. All Edge Functions live in `/backend/functions/<function-name>/index.ts` using the Supabase Deno runtime.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Mobile SDK / Web Dashboard                                 │
│  (sends x-publishable-key header or Supabase Auth JWT)      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────────┐
│  Supabase Edge Functions (Deno runtime)                     │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌─────────┐ ┌────────┐  │
│  │ board  │ │ posts  │ │ votes  │ │ devices │ │ rotate │  │
│  └───┬────┘ └───┬────┘ └───┬────┘ └────┬────┘ └───┬────┘  │
│      │          │          │            │          │        │
│  ┌───▼──────────▼──────────▼────────────▼──────────▼────┐  │
│  │  Shared Utilities (_shared/)                          │  │
│  │  • validate-key.ts  (key lookup + project resolution) │  │
│  │  • rate-limit.ts    (check + increment)               │  │
│  │  • cors.ts          (CORS headers + OPTIONS handler)  │  │
│  │  • response.ts      (JSON success/error helpers)      │  │
│  └──────────────────────────┬───────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────┘
                              │ service_role client
┌─────────────────────────────▼───────────────────────────────┐
│  Supabase Postgres                                          │
│  ┌──────────┐ ┌───────┐ ┌───────┐ ┌─────────┐ ┌─────────┐ │
│  │ projects │ │ posts │ │ votes │ │ devices │ │rate_lims│ │
│  └──────────┘ └───────┘ └───┬───┘ └─────────┘ └─────────┘ │
│                              │                              │
│  ┌───────────────────────────▼──────────────────────────┐   │
│  │  Trigger: update_vote_count()                        │   │
│  │  AFTER INSERT / AFTER DELETE on votes                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  RLS Policies:                                              │
│  • SDK policies (key-based, via request header)             │
│  • Admin policies (auth.uid()-based, for developers)        │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
/backend
├── migrations/
│   ├── 001_schema.sql           # Tables: projects, posts, votes, devices, rate_limits
│   ├── 002_triggers.sql         # Vote count trigger function + trigger
│   ├── 003_rls_policies.sql     # RLS enable + all policies (SDK + admin)
│   └── 004_seed.sql             # Test project, sample posts, devices, votes
│
└── functions/
    ├── _shared/
    │   ├── validate-key.ts      # Publishable key validation helper
    │   ├── rate-limit.ts        # Rate limit check/increment helper
    │   ├── cors.ts              # CORS headers and OPTIONS handler
    │   └── response.ts          # JSON response helpers (success, error)
    │
    ├── board/
    │   └── index.ts             # GET /board — paginated post list
    │
    ├── posts/
    │   └── index.ts             # POST /posts — create feature request
    │
    ├── votes/
    │   └── index.ts             # POST /votes — cast vote, DELETE /votes — remove vote
    │
    ├── devices/
    │   └── index.ts             # POST /devices — register/update device
    │
    └── rotate-key/
        └── index.ts             # POST /rotate-key — key rotation (developer-only)
```

## Components and Interfaces

### Component 1: Database Schema (001_schema.sql)

Creates all five tables with appropriate types, constraints, and foreign keys.

```sql
-- projects
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL,
  platform text,
  publishable_key text UNIQUE NOT NULL,
  theme_json jsonb,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- posts
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id),
  title text NOT NULL,
  description text,
  status text DEFAULT 'open' CHECK (status IN ('open', 'planned', 'in_progress', 'shipped', 'declined')),
  vote_count integer DEFAULT 0,
  device_id uuid NOT NULL,
  screen_context text,
  app_version text,
  os text,
  created_at timestamptz DEFAULT now()
);

-- votes
CREATE TABLE votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id),
  device_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (post_id, device_id)
);

-- devices
CREATE TABLE devices (
  device_id uuid PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id),
  push_token text,
  first_seen timestamptz DEFAULT now()
);

-- rate_limits
CREATE TABLE rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid NOT NULL,
  project_id uuid NOT NULL,
  endpoint text NOT NULL,
  window_start timestamptz NOT NULL,
  request_count integer DEFAULT 1
);
```

### Component 2: Vote Count Trigger (002_triggers.sql)

A Postgres trigger function that maintains the denormalized `vote_count` on posts.

```sql
CREATE OR REPLACE FUNCTION update_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET vote_count = vote_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET vote_count = vote_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_vote_count
  AFTER INSERT OR DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_vote_count();
```

### Component 3: RLS Policies (003_rls_policies.sql)

Two policy groups: SDK-level (key-based) and Admin-level (auth.uid()-based).

**SDK access pattern:** Edge Functions pass the resolved `project_id` as a custom claim or use the service_role key to bypass RLS and handle scoping in application code. The simpler approach for Supabase Edge Functions: use `service_role` key internally (bypasses RLS) and validate project scoping in the function logic. RLS policies then protect against direct PostgREST access.

For direct PostgREST access (future dashboard use), RLS policies use `auth.uid()` to scope developer access.

```sql
-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- ADMIN (Developer) policies — uses auth.uid()
-- =============================================================

-- projects: developer sees only their own
CREATE POLICY "developers_own_projects" ON projects
  FOR ALL USING (developer_id = auth.uid());

-- posts: developer sees posts in their projects
CREATE POLICY "developers_manage_posts" ON posts
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE developer_id = auth.uid())
  );

-- votes: developer can read votes in their projects
CREATE POLICY "developers_read_votes" ON votes
  FOR SELECT USING (
    post_id IN (
      SELECT p.id FROM posts p
      JOIN projects pr ON p.project_id = pr.id
      WHERE pr.developer_id = auth.uid()
    )
  );

-- devices: developer can read devices in their projects
CREATE POLICY "developers_read_devices" ON devices
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE developer_id = auth.uid())
  );

-- =============================================================
-- SDK policies — uses request header for publishable key
-- (These apply when using anon key + header, not service_role)
-- =============================================================

-- Helper function to resolve project_id from the publishable key header
CREATE OR REPLACE FUNCTION get_project_id_from_key()
RETURNS uuid AS $$
  SELECT id FROM projects
  WHERE publishable_key = current_setting('request.headers', true)::json->>'x-publishable-key'
    AND is_active = true;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- posts: SDK can read posts for its project
CREATE POLICY "sdk_read_posts" ON posts
  FOR SELECT USING (project_id = get_project_id_from_key());

-- posts: SDK can insert posts for its project
CREATE POLICY "sdk_insert_posts" ON posts
  FOR INSERT WITH CHECK (project_id = get_project_id_from_key());

-- votes: SDK can insert votes for posts in its project
CREATE POLICY "sdk_insert_votes" ON votes
  FOR INSERT WITH CHECK (
    post_id IN (SELECT id FROM posts WHERE project_id = get_project_id_from_key())
  );

-- votes: SDK can delete its own votes
CREATE POLICY "sdk_delete_votes" ON votes
  FOR DELETE USING (
    post_id IN (SELECT id FROM posts WHERE project_id = get_project_id_from_key())
  );

-- devices: SDK can insert/update devices for its project
CREATE POLICY "sdk_manage_devices" ON devices
  FOR ALL USING (project_id = get_project_id_from_key())
  WITH CHECK (project_id = get_project_id_from_key());
```

**Key design decisions for RLS:**
- SDK policies use a helper function `get_project_id_from_key()` that reads the `x-publishable-key` header via `current_setting('request.headers')` and resolves it to a project_id, also checking `is_active = true`.
- No SDK policy exists for UPDATE on posts (prevents status changes from SDK).
- No SDK policy exists for writes on projects (prevents project modification from SDK).
- Admin policies use `auth.uid()` directly to scope to the developer's own projects.
- Edge Functions use the `service_role` key for internal operations (bypasses RLS), performing project scoping validation in application code.

### Component 4: Seed Data (004_seed.sql)

```sql
-- Test developer (uses a fixed UUID for local dev)
-- In production, developers come from Supabase Auth signup

-- Test project
INSERT INTO projects (id, developer_id, name, platform, publishable_key, is_active)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000', -- placeholder dev ID
  'Test Project',
  'flutter',
  'feature_poll_pk_test_key_123',
  true
);

-- Test devices
INSERT INTO devices (device_id, project_id) VALUES
  ('aaaa0000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111'),
  ('aaaa0000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111'),
  ('aaaa0000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111');

-- Sample posts with varying statuses
INSERT INTO posts (id, project_id, title, description, status, vote_count, device_id) VALUES
  ('22222222-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   'Dark mode support', 'Please add dark mode to the app', 'open', 5,
   'aaaa0000-0000-0000-0000-000000000001'),
  ('22222222-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
   'Export to PDF', 'Allow exporting reports as PDF', 'planned', 3,
   'aaaa0000-0000-0000-0000-000000000002'),
  ('22222222-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111',
   'Push notifications', 'Get notified when features ship', 'shipped', 8,
   'aaaa0000-0000-0000-0000-000000000003');

-- Votes consistent with vote_counts above
-- Post 1: 5 votes (we only have 3 devices, so some are from device 1,2,3 + 2 extra devices)
INSERT INTO devices (device_id, project_id) VALUES
  ('aaaa0000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111'),
  ('aaaa0000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111');

INSERT INTO votes (post_id, device_id) VALUES
  ('22222222-0000-0000-0000-000000000001', 'aaaa0000-0000-0000-0000-000000000001'),
  ('22222222-0000-0000-0000-000000000001', 'aaaa0000-0000-0000-0000-000000000002'),
  ('22222222-0000-0000-0000-000000000001', 'aaaa0000-0000-0000-0000-000000000003'),
  ('22222222-0000-0000-0000-000000000001', 'aaaa0000-0000-0000-0000-000000000004'),
  ('22222222-0000-0000-0000-000000000001', 'aaaa0000-0000-0000-0000-000000000005'),
  -- Post 2: 3 votes
  ('22222222-0000-0000-0000-000000000002', 'aaaa0000-0000-0000-0000-000000000001'),
  ('22222222-0000-0000-0000-000000000002', 'aaaa0000-0000-0000-0000-000000000002'),
  ('22222222-0000-0000-0000-000000000002', 'aaaa0000-0000-0000-0000-000000000003'),
  -- Post 3: 8 votes (need 3 more devices)
  ('22222222-0000-0000-0000-000000000003', 'aaaa0000-0000-0000-0000-000000000001'),
  ('22222222-0000-0000-0000-000000000003', 'aaaa0000-0000-0000-0000-000000000002'),
  ('22222222-0000-0000-0000-000000000003', 'aaaa0000-0000-0000-0000-000000000003'),
  ('22222222-0000-0000-0000-000000000003', 'aaaa0000-0000-0000-0000-000000000004'),
  ('22222222-0000-0000-0000-000000000003', 'aaaa0000-0000-0000-0000-000000000005');

-- Need 3 more devices for post 3 to reach 8 votes
INSERT INTO devices (device_id, project_id) VALUES
  ('aaaa0000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111'),
  ('aaaa0000-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111'),
  ('aaaa0000-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111');

INSERT INTO votes (post_id, device_id) VALUES
  ('22222222-0000-0000-0000-000000000003', 'aaaa0000-0000-0000-0000-000000000006'),
  ('22222222-0000-0000-0000-000000000003', 'aaaa0000-0000-0000-0000-000000000007'),
  ('22222222-0000-0000-0000-000000000003', 'aaaa0000-0000-0000-0000-000000000008');
```

**Note:** The seed inserts vote records directly. In production the trigger would maintain vote_count, but for seed data we set vote_count explicitly to avoid trigger ordering issues during bulk insert.

### Component 5: Shared Utilities (`/backend/functions/_shared/`)

#### validate-key.ts — Publishable Key Validation

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface ValidatedProject {
  id: string;
  name: string;
  developer_id: string;
}

interface ValidationResult {
  project: ValidatedProject | null;
  error: string | null;
  status: number;
}

export async function validatePublishableKey(
  req: Request
): Promise<ValidationResult> {
  const key = req.headers.get("x-publishable-key");

  if (!key) {
    return { project: null, error: "Missing publishable key", status: 401 };
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: project, error } = await supabase
    .from("projects")
    .select("id, name, developer_id, is_active")
    .eq("publishable_key", key)
    .single();

  if (error || !project) {
    return { project: null, error: "Invalid publishable key", status: 401 };
  }

  if (!project.is_active) {
    return { project: null, error: "Project is disabled", status: 401 };
  }

  return {
    project: { id: project.id, name: project.name, developer_id: project.developer_id },
    error: null,
    status: 200,
  };
}
```

#### rate-limit.ts — Rate Limit Helper

```typescript
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const LIMITS: Record<string, number> = {
  "/posts": 10,
  "/votes": 30,
};

const WINDOW_SECONDS = 60;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export async function checkRateLimit(
  supabase: SupabaseClient,
  deviceId: string,
  projectId: string,
  endpoint: string
): Promise<RateLimitResult> {
  const limit = LIMITS[endpoint] ?? 10;
  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_SECONDS * 1000);

  // Check existing rate limit record within the current window
  const { data: existing } = await supabase
    .from("rate_limits")
    .select("id, request_count, window_start")
    .eq("device_id", deviceId)
    .eq("project_id", projectId)
    .eq("endpoint", endpoint)
    .gte("window_start", windowStart.toISOString())
    .single();

  if (!existing) {
    // No record in current window — create new one
    await supabase.from("rate_limits").insert({
      device_id: deviceId,
      project_id: projectId,
      endpoint,
      window_start: now.toISOString(),
      request_count: 1,
    });
    return { allowed: true, remaining: limit - 1 };
  }

  // Check if window has expired
  const recordWindowStart = new Date(existing.window_start);
  const windowEnd = new Date(recordWindowStart.getTime() + WINDOW_SECONDS * 1000);

  if (now > windowEnd) {
    // Window expired — reset
    await supabase
      .from("rate_limits")
      .update({ request_count: 1, window_start: now.toISOString() })
      .eq("id", existing.id);
    return { allowed: true, remaining: limit - 1 };
  }

  if (existing.request_count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  // Increment count
  await supabase
    .from("rate_limits")
    .update({ request_count: existing.request_count + 1 })
    .eq("id", existing.id);

  return { allowed: true, remaining: limit - existing.request_count - 1 };
}
```

#### cors.ts — CORS Handler

```typescript
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-publishable-key",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};

export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  return null;
}
```

#### response.ts — Response Helpers

```typescript
import { corsHeaders } from "./cors.ts";

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function errorResponse(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

### Component 6: Edge Function — Board (`/backend/functions/board/index.ts`)

```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validatePublishableKey } from "../_shared/validate-key.ts";
import { handleCors } from "../_shared/cors.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Validate publishable key
  const { project, error, status } = await validatePublishableKey(req);
  if (!project) return errorResponse(error!, status);

  // Parse pagination params
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("page_size") ?? "20")));
  const offset = (page - 1) * pageSize;

  // Query posts
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: posts, error: queryError } = await supabase
    .from("posts")
    .select("id, title, description, status, vote_count, created_at")
    .eq("project_id", project.id)
    .order("vote_count", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (queryError) {
    return errorResponse("Failed to fetch posts", 500);
  }

  return jsonResponse({ posts, page, page_size: pageSize });
});
```

### Component 7: Edge Function — Posts (`/backend/functions/posts/index.ts`)

```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validatePublishableKey } from "../_shared/validate-key.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { handleCors } from "../_shared/cors.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const { project, error, status } = await validatePublishableKey(req);
  if (!project) return errorResponse(error!, status);

  const body = await req.json();
  const { title, device_id, description, screen_context, app_version, os } = body;

  // Validate required fields
  if (!title || title.trim() === "") {
    return errorResponse("Title is required", 400);
  }
  if (!device_id) {
    return errorResponse("device_id is required", 400);
  }

  // Rate limit check
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const rateLimitResult = await checkRateLimit(supabase, device_id, project.id, "/posts");
  if (!rateLimitResult.allowed) {
    return errorResponse("Rate limit exceeded", 429);
  }

  // Register device if not exists (silent upsert)
  await supabase
    .from("devices")
    .upsert({ device_id, project_id: project.id }, { onConflict: "device_id" });

  // Insert post
  const { data: post, error: insertError } = await supabase
    .from("posts")
    .insert({
      project_id: project.id,
      title: title.trim(),
      description: description ?? null,
      device_id,
      screen_context: screen_context ?? null,
      app_version: app_version ?? null,
      os: os ?? null,
      status: "open",
    })
    .select("id, title, description, status, vote_count, created_at")
    .single();

  if (insertError) {
    return errorResponse("Failed to create post", 500);
  }

  return jsonResponse({ post }, 201);
});
```

### Component 8: Edge Function — Votes (`/backend/functions/votes/index.ts`)

Handles both POST (cast vote) and DELETE (remove vote) via method routing.

```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validatePublishableKey } from "../_shared/validate-key.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { handleCors } from "../_shared/cors.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const { project, error, status } = await validatePublishableKey(req);
  if (!project) return errorResponse(error!, status);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const body = await req.json();
  const { post_id, device_id } = body;

  if (!post_id || !device_id) {
    return errorResponse("post_id and device_id are required", 400);
  }

  // Verify post belongs to this project
  const { data: post } = await supabase
    .from("posts")
    .select("id")
    .eq("id", post_id)
    .eq("project_id", project.id)
    .single();

  if (!post) {
    return errorResponse("Post not found or does not belong to this project", 403);
  }

  if (req.method === "POST") {
    // Rate limit check for voting
    const rateLimitResult = await checkRateLimit(supabase, device_id, project.id, "/votes");
    if (!rateLimitResult.allowed) {
      return errorResponse("Rate limit exceeded", 429);
    }

    // Upsert vote (idempotent — returns existing if already voted)
    const { data: vote, error: voteError } = await supabase
      .from("votes")
      .upsert(
        { post_id, device_id },
        { onConflict: "post_id,device_id" }
      )
      .select("id, post_id, device_id, created_at")
      .single();

    if (voteError) {
      return errorResponse("Failed to cast vote", 500);
    }

    return jsonResponse({ vote }, 201);
  }

  if (req.method === "DELETE") {
    // Delete vote (idempotent — no error if not found)
    await supabase
      .from("votes")
      .delete()
      .eq("post_id", post_id)
      .eq("device_id", device_id);

    return jsonResponse({ message: "Vote removed" }, 200);
  }

  return errorResponse("Method not allowed", 405);
});
```

### Component 9: Edge Function — Devices (`/backend/functions/devices/index.ts`)

```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validatePublishableKey } from "../_shared/validate-key.ts";
import { handleCors } from "../_shared/cors.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const { project, error, status } = await validatePublishableKey(req);
  if (!project) return errorResponse(error!, status);

  const body = await req.json();
  const { device_id, push_token } = body;

  if (!device_id) {
    return errorResponse("device_id is required", 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: device, error: upsertError } = await supabase
    .from("devices")
    .upsert(
      {
        device_id,
        project_id: project.id,
        push_token: push_token ?? null,
      },
      { onConflict: "device_id" }
    )
    .select("device_id, project_id, push_token, first_seen")
    .single();

  if (upsertError) {
    return errorResponse("Failed to register device", 500);
  }

  return jsonResponse({ device }, 200);
});
```

### Component 10: Edge Function — Rotate Key (`/backend/functions/rotate-key/index.ts`)

This is a developer-only endpoint requiring Supabase Auth.

```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

function generatePublishableKey(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => chars[b % chars.length])
    .join("");
  return `feature_poll_pk_${randomPart}`;
}

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Authenticate developer via JWT
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return errorResponse("Authorization required", 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Verify the JWT and get user
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return errorResponse("Invalid authentication", 401);
  }

  const body = await req.json();
  const { project_id } = body;

  if (!project_id) {
    return errorResponse("project_id is required", 400);
  }

  // Verify developer owns this project
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", project_id)
    .eq("developer_id", user.id)
    .single();

  if (!project) {
    return errorResponse("Project not found or not owned by you", 403);
  }

  // Generate and save new key
  const newKey = generatePublishableKey();
  const { error: updateError } = await supabase
    .from("projects")
    .update({ publishable_key: newKey })
    .eq("id", project_id);

  if (updateError) {
    return errorResponse("Failed to rotate key", 500);
  }

  return jsonResponse({ publishable_key: newKey });
});
```

## Data Models

### Request/Response Interfaces

```typescript
// Board response
interface BoardResponse {
  posts: PostSummary[];
  page: number;
  page_size: number;
}

interface PostSummary {
  id: string;
  title: string;
  description: string | null;
  status: "open" | "planned" | "in_progress" | "shipped" | "declined";
  vote_count: number;
  created_at: string;
}

// Create post request
interface CreatePostRequest {
  title: string;
  device_id: string;
  description?: string;
  screen_context?: string;
  app_version?: string;
  os?: string;
}

// Vote request
interface VoteRequest {
  post_id: string;
  device_id: string;
}

// Device registration request
interface RegisterDeviceRequest {
  device_id: string;
  push_token?: string;
}

// Key rotation request (developer-only)
interface RotateKeyRequest {
  project_id: string;
}
```

### Key Validation Flow

```
Request arrives with x-publishable-key header
    │
    ▼
Header present? ──No──► 401 "Missing publishable key"
    │ Yes
    ▼
Query projects table by publishable_key
    │
    ▼
Row found? ──No──► 401 "Invalid publishable key"
    │ Yes
    ▼
project.is_active? ──false──► 401 "Project is disabled"
    │ true
    ▼
Return { project_id, name, developer_id }
(pass project_id to endpoint handler)
```

### Rate Limiting Flow

```
POST /posts or /votes arrives (after key validation)
    │
    ▼
Query rate_limits for (device_id, project_id, endpoint)
where window_start > now() - 60s
    │
    ▼
Record found? ──No──► INSERT new record (count=1) → ALLOW
    │ Yes
    ▼
Window expired? ──Yes──► UPDATE (count=1, window_start=now()) → ALLOW
    │ No
    ▼
count >= limit? ──Yes──► 429 "Rate limit exceeded"
    │ No
    ▼
UPDATE count = count + 1 → ALLOW
```

## Error Handling

| Scenario | HTTP Status | Error Message |
|----------|-------------|---------------|
| Missing x-publishable-key header | 401 | "Missing publishable key" |
| Key not found in projects table | 401 | "Invalid publishable key" |
| Project is_active = false | 401 | "Project is disabled" |
| Missing required field (title, device_id) | 400 | "{field} is required" |
| Rate limit exceeded | 429 | "Rate limit exceeded" |
| Post not in project (cross-project vote) | 403 | "Post not found or does not belong to this project" |
| Internal database error | 500 | "Failed to {operation}" |
| Unsupported HTTP method | 405 | "Method not allowed" |

## CORS Pattern

Every Edge Function applies the same CORS pattern via the shared `cors.ts` utility:

1. Import `corsHeaders` and `handleCors` from `_shared/cors.ts`
2. First line of the handler: check for OPTIONS and return early
3. All responses include `corsHeaders` in their headers (handled by `jsonResponse`/`errorResponse`)

The allowed headers explicitly include `x-publishable-key` so that browser-based clients (future web SDK) can send the custom header without CORS blocking the preflight.

## Testing Strategy

**Dual approach: property-based tests for universal behaviors + example-based tests for specific cases.**

### Property-Based Tests (minimum 100 iterations each)

Property tests validate the universal correctness properties defined below. They use generated inputs to cover edge cases that manual test authoring would miss.

Key areas for PBT:
- **Vote count trigger**: Generate random sequences of vote inserts/deletes and verify the invariant holds
- **Rate limiting logic**: Generate request sequences with varying timing and verify enforcement
- **Key validation**: Generate keys of various formats and verify correct accept/reject behavior
- **Pagination**: Generate datasets of various sizes and verify correct slicing
- **Idempotence**: Generate duplicate operations and verify single-write behavior

Implementation: Use a TypeScript PBT library (e.g., `fast-check`) against the pure logic functions (rate limit check, key format validation, pagination calculation). For database-dependent properties, use integration tests with generated data.

### Example-Based / Integration Tests

- **Schema smoke tests**: Verify tables exist with correct columns and constraints
- **Seed data verification**: Verify test project and sample data are consistent
- **CORS**: Verify OPTIONS returns correct headers
- **Error responses**: Verify specific error messages for missing/invalid keys
- **Cross-project access**: Verify 403 for cross-project vote attempts

### Edge Case Tests

- Empty/whitespace title validation (HTTP 400)
- Missing device_id (HTTP 400)
- Missing x-publishable-key header (HTTP 401)
- Non-existent key (HTTP 401)
- Disabled project key (HTTP 401)

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Vote Count Invariant

*For any* post at any point in time, the value of `posts.vote_count` SHALL equal the count of rows in the `votes` table where `votes.post_id` equals that post's `id`.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 2: SDK Project Isolation

*For any* publishable key K associated with project P, all data operations (read or write) performed via that key SHALL only affect rows where `project_id = P`. No row belonging to a different project shall be readable or writable.

**Validates: Requirements 4.2, 4.3, 4.4, 4.5, 8.3, 9.3**

### Property 3: SDK Operation Restrictions

*For any* SDK request (authenticated via publishable key, not developer JWT), the request SHALL be unable to UPDATE the `status` column on any post, and SHALL be unable to perform any INSERT, UPDATE, or DELETE on the `projects` table.

**Validates: Requirements 4.6, 4.7**

### Property 4: Developer Data Isolation

*For any* two distinct developers A and B, developer A SHALL only be able to read or modify projects, posts, votes, and devices where the owning project's `developer_id` equals A's auth user ID. No row belonging to B's projects shall be accessible to A.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 5: Board Sort Order

*For any* project with N posts (N > 1), the response from GET /board SHALL return posts in non-increasing order of `vote_count` — that is, for every consecutive pair of posts (i, i+1) in the result, `posts[i].vote_count >= posts[i+1].vote_count`.

**Validates: Requirements 6.1**

### Property 6: Pagination Correctness

*For any* project with total posts T, and any valid (page, page_size) parameters, the response SHALL contain at most `page_size` posts, and the set of posts returned for page P shall not overlap with the set returned for page P+1 (given the same sort order).

**Validates: Requirements 6.2**

### Property 7: Post Creation Preserves Input

*For any* valid title T and device_id D submitted to POST /posts, the resulting post SHALL have `title = T`, `device_id = D`, and `status = 'open'`.

**Validates: Requirements 7.1**

### Property 8: Vote Idempotence

*For any* (post_id, device_id) pair, calling POST /votes N times (N >= 1) SHALL result in exactly one row in the `votes` table for that pair. The operation is idempotent.

**Validates: Requirements 8.1, 8.2**

### Property 9: Vote Removal Idempotence

*For any* (post_id, device_id) pair, calling DELETE /votes when no vote exists SHALL return HTTP 200 without error. Calling DELETE on an existing vote SHALL remove it and return HTTP 200.

**Validates: Requirements 9.1, 9.2**

### Property 10: Device Upsert Idempotence

*For any* device_id D called N times (N >= 1) to POST /devices with varying push_token values, there SHALL be exactly one row in the `devices` table for that device_id, and its `push_token` SHALL equal the value from the most recent call.

**Validates: Requirements 10.1, 10.3**

### Property 11: Rate Limit Enforcement

*For any* device making requests to a rate-limited endpoint, if the device has made more than the configured limit (10 for /posts, 30 for /votes) requests within a 60-second window, all subsequent requests within that window SHALL be rejected with HTTP 429.

**Validates: Requirements 7.4, 8.4, 12.1, 12.2, 12.3**

### Property 12: Rate Limit Window Reset

*For any* device whose rate limit window has expired (current time > window_start + 60 seconds), the next request SHALL reset the counter to 1 and succeed, regardless of the previous request count.

**Validates: Requirements 12.4**

### Property 13: Publishable Key Format

*For any* generated publishable key, the key SHALL match the pattern `feature_poll_pk_` followed by exactly 32 alphanumeric characters (regex: `^feature_poll_pk_[a-zA-Z0-9]{32}$`).

**Validates: Requirements 13.1, 14.1**

### Property 14: Key Rotation Invalidates Old Key

*For any* project that undergoes key rotation, all SDK requests using the previous publishable key SHALL receive HTTP 401 after the rotation completes.

**Validates: Requirements 14.2**

### Property 15: Project Enable/Disable Round Trip

*For any* project, setting `is_active = false` SHALL cause all SDK requests to that project's key to return HTTP 401, and subsequently setting `is_active = true` SHALL restore successful SDK access using the same key.

**Validates: Requirements 15.1, 15.2**

### Property 16: Input Validation Rejects Invalid Titles

*For any* string composed entirely of whitespace (or empty string), submitting it as the `title` to POST /posts SHALL be rejected with HTTP 400.

**Validates: Requirements 7.2**
