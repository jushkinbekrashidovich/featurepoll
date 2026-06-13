# Design Document

## Overview

This document describes the architecture and implementation design for the FeaturePoll Web Dashboard — the authenticated developer-facing application within the existing `/web` Next.js App Router codebase. The dashboard provides project management, feature request triaging, roadmap/status management, theme configuration, and key management for FeaturePoll developers.

The design leverages Next.js Server Components by default, `@supabase/ssr` for cookie-based auth, Server Actions for mutations, and Tailwind CSS with the existing brand tokens.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Middleware                     │
│          (route protection: /dashboard/* check)          │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│               /web/app/dashboard/layout.tsx               │
│  ┌──────────┐  ┌─────────────────────────────────────┐  │
│  │  Sidebar │  │         Main Content Area            │  │
│  │(client)  │  │     (Server Components by default)   │  │
│  │          │  │                                      │  │
│  │• Switcher│  │  /board     → PostList (server)      │  │
│  │• Nav     │  │  /roadmap   → StatusColumns (client) │  │
│  │          │  │  /changelog → ShippedList (server)   │  │
│  │          │  │  /settings  → SettingsForm (client)  │  │
│  └──────────┘  └─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         │
                Server Actions (mutations)
                         │
┌────────────────────────▼────────────────────────────────┐
│              Supabase (via @supabase/ssr)                 │
│        • Auth (magic link, GitHub OAuth)                  │
│        • Postgres + RLS (data scoped to developer)       │
│        • Edge Functions (rotate-key)                     │
└─────────────────────────────────────────────────────────┘
```

---

## File Structure

```
/web
├── middleware.ts                          # Route protection
├── lib/
│   ├── supabase/
│   │   ├── server.ts                     # createServerClient helper
│   │   ├── browser.ts                    # createBrowserClient helper
│   │   └── middleware.ts                 # Supabase middleware client helper
│   └── supabase.ts                       # (existing, keep for marketing pages)
├── app/
│   └── dashboard/
│       ├── layout.tsx                    # Dashboard shell (sidebar + main)
│       ├── page.tsx                      # Redirect to /dashboard/board
│       ├── login/
│       │   └── page.tsx                  # Login page (magic link + GitHub)
│       ├── auth/
│       │   └── callback/
│       │       └── route.ts             # Auth callback handler (GET)
│       ├── board/
│       │   └── page.tsx                  # Board tab — post list
│       ├── roadmap/
│       │   └── page.tsx                  # Roadmap tab — status columns
│       ├── changelog/
│       │   └── page.tsx                  # Changelog tab — shipped posts
│       ├── settings/
│       │   └── page.tsx                  # Settings tab (theme, keys, billing)
│       └── actions/
│           ├── projects.ts               # Server Actions for project CRUD
│           ├── posts.ts                  # Server Actions for post status updates
│           └── settings.ts              # Server Actions for theme/key operations
└── components/
    └── dashboard/
        ├── sidebar.tsx                   # Sidebar with nav + project switcher
        ├── project-switcher.tsx          # Project dropdown (client component)
        ├── create-project-modal.tsx      # Project creation modal (client)
        ├── post-card.tsx                 # Single post display card
        ├── status-column.tsx             # Roadmap status column
        ├── status-dropdown.tsx           # Status change dropdown (client)
        ├── color-picker.tsx              # Theme color picker (client)
        ├── copy-button.tsx               # Copy-to-clipboard button (client)
        └── empty-state.tsx               # Reusable empty state display
```

---

## Components and Interfaces

### Supabase Client Helpers

#### Server Client (`/web/lib/supabase/server.ts`)

Creates a Supabase client for Server Components and Server Actions using `@supabase/ssr`. Reads/writes auth cookies via the Next.js `cookies()` API.

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component — ignore
          }
        },
      },
    }
  );
}
```

#### Browser Client (`/web/lib/supabase/browser.ts`)

Creates a singleton Supabase client for Client Components. Used for realtime subscriptions or client-side calls if needed.

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

#### Middleware Client (`/web/lib/supabase/middleware.ts`)

Creates a Supabase client that can refresh sessions in middleware context.

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Unauthenticated user trying to access protected route
  if (
    !user &&
    request.nextUrl.pathname.startsWith("/dashboard") &&
    !request.nextUrl.pathname.startsWith("/dashboard/login") &&
    !request.nextUrl.pathname.startsWith("/dashboard/auth")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard/login";
    return NextResponse.redirect(url);
  }

  // Authenticated user on login page → redirect to dashboard
  if (user && request.nextUrl.pathname === "/dashboard/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

---

### Middleware (`/web/middleware.ts`)

```typescript
import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

---

### Auth Callback (`/web/app/dashboard/auth/callback/route.ts`)

Handles the redirect from Supabase Auth (magic link or OAuth). Exchanges the code for a session.

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    const loginUrl = new URL("/dashboard/login", origin);
    loginUrl.searchParams.set("error", errorDescription || error);
    return NextResponse.redirect(loginUrl);
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      return NextResponse.redirect(new URL("/dashboard", origin));
    }
  }

  // Fallback: redirect to login with generic error
  const loginUrl = new URL("/dashboard/login", origin);
  loginUrl.searchParams.set("error", "Authentication failed");
  return NextResponse.redirect(loginUrl);
}
```

---

### Dashboard Layout (`/web/app/dashboard/layout.tsx`)

Server Component that wraps all dashboard pages. Fetches the developer's projects and passes them to the Sidebar. The currently selected project is stored as a URL search param (`?project=<uuid>`) — this keeps state bookmarkable, shareable, and SSR-friendly without extra client state.

```typescript
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/dashboard/login");
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .order("created_at", { ascending: true });

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-950">
      <Sidebar projects={projects ?? []} />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
```

---

### Project Switcher State

The active project is stored as a **URL search parameter** (`?project=<uuid>`).

**Rationale:**
- Server Components can read it directly from `searchParams` — no client-side hydration needed for initial data fetch.
- Bookmarkable and shareable links.
- No cookie or context overhead.
- When no `?project` param is present, the dashboard defaults to the first project (or shows a "create project" prompt if none exist).

Each dashboard page reads `searchParams.project`, fetches the project, and passes it to its children.

---

### Server Actions

All data mutations use Next.js Server Actions (no API routes). Each action:
1. Creates a server Supabase client (with cookies for auth).
2. Validates the user owns the target resource (RLS handles this implicitly).
3. Performs the mutation.
4. Calls `revalidatePath` to refresh the relevant page.

#### Project Actions (`/web/app/dashboard/actions/projects.ts`)

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createProject(name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const publishableKey = `feature_poll_pk_${crypto.randomUUID().replace(/-/g, "")}`;

  const { data, error } = await supabase
    .from("projects")
    .insert({
      developer_id: user.id,
      name,
      publishable_key: publishableKey,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  return data;
}
```

#### Post Actions (`/web/app/dashboard/actions/posts.ts`)

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type PostStatus = "open" | "planned" | "in_progress" | "shipped" | "declined";

export async function updatePostStatus(postId: string, status: PostStatus) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("posts")
    .update({ status })
    .eq("id", postId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/roadmap");
  revalidatePath("/dashboard/changelog");
  return { success: true };
}
```

#### Settings Actions (`/web/app/dashboard/actions/settings.ts`)

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateThemeColor(projectId: string, accentColor: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("projects")
    .update({ theme_json: { accent_color: accentColor } })
    .eq("id", projectId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function rotateKey(projectId: string) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Unauthorized");

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/rotate-key`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ project_id: projectId }),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to rotate key");
  }

  const { publishable_key } = await response.json();

  revalidatePath("/dashboard/settings");
  return { publishable_key };
}

export async function toggleProjectActive(projectId: string, isActive: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("projects")
    .update({ is_active: isActive })
    .eq("id", projectId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/settings");
  return { success: true };
}
```

---

### Component Architecture

| Component | Type | Reason |
|-----------|------|--------|
| `dashboard/layout.tsx` | Server | Fetches projects, checks auth |
| `dashboard/board/page.tsx` | Server | Fetches posts with sort |
| `dashboard/roadmap/page.tsx` | Server | Fetches posts grouped by status |
| `dashboard/changelog/page.tsx` | Server | Fetches shipped posts |
| `dashboard/settings/page.tsx` | Server | Fetches project settings |
| `sidebar.tsx` | Client | Interactive navigation + project switcher |
| `project-switcher.tsx` | Client | Dropdown interaction |
| `create-project-modal.tsx` | Client | Form with state |
| `status-dropdown.tsx` | Client | Dropdown + optimistic update |
| `color-picker.tsx` | Client | Color input interaction |
| `copy-button.tsx` | Client | Clipboard API (browser-only) |
| `post-card.tsx` | Server | Presentational, no interactivity |
| `empty-state.tsx` | Server | Presentational |

---

## Data Models

```typescript
// /web/lib/types.ts

export interface Project {
  id: string;
  developer_id: string;
  name: string;
  platform: string | null;
  publishable_key: string;
  theme_json: ThemeJson | null;
  is_active: boolean;
  created_at: string;
}

export interface ThemeJson {
  accent_color: string;
}

export interface Post {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: PostStatus;
  vote_count: number;
  device_id: string;
  screen_context: string | null;
  app_version: string | null;
  os: string | null;
  created_at: string;
}

export type PostStatus = "open" | "planned" | "in_progress" | "shipped" | "declined";
```

---

## Interfaces

### Auth Callback Route

- **Method:** `GET`
- **Path:** `/dashboard/auth/callback`
- **Query params:** `code` (auth code from Supabase) or `error` / `error_description`
- **Success:** Redirects to `/dashboard`
- **Failure:** Redirects to `/dashboard/login?error=<message>`

### Server Actions Interface

| Action | Params | Returns |
|--------|--------|---------|
| `createProject(name)` | `string` | `Project` |
| `updatePostStatus(postId, status)` | `string, PostStatus` | `{ success: boolean }` |
| `updateThemeColor(projectId, color)` | `string, string` | `{ success: boolean }` |
| `rotateKey(projectId)` | `string` | `{ publishable_key: string }` |
| `toggleProjectActive(projectId, isActive)` | `string, boolean` | `{ success: boolean }` |

### Rotate Key Edge Function

- **Method:** `POST`
- **URL:** `${SUPABASE_URL}/functions/v1/rotate-key`
- **Headers:** `Authorization: Bearer <access_token>`, `Content-Type: application/json`
- **Body:** `{ "project_id": "<uuid>" }`
- **Response:** `{ "publishable_key": "feature_poll_pk_..." }`

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Unauthenticated access | Middleware redirects to `/dashboard/login` |
| Auth callback error | Redirect to `/dashboard/login?error=<message>` |
| Server Action auth failure | Throws `"Unauthorized"`, caught by client error boundary |
| Project creation failure | Server Action throws, client displays error toast, preserves input |
| Status update failure | Client reverts optimistic update, shows error toast |
| Key rotation failure | Client shows error message, retains previous key display |
| Network error | Client-side try/catch around Server Action calls, generic error toast |

All client components that call Server Actions wrap calls in try/catch and use local state to manage optimistic UI and error rollback.

---

## Key Design Decisions

1. **URL search param for project selection** — Keeps project context server-readable, bookmarkable, and avoids client-only state. The `?project=<uuid>` param is passed through navigation links automatically.

2. **Server Actions over API routes** — Simpler code, automatic cookie forwarding, built-in form progressive enhancement, and `revalidatePath` integration.

3. **`@supabase/ssr` with cookie strategy** — The session lives in HTTP-only cookies managed by the middleware. No localStorage tokens, no client-side session management. Server Components can read the session directly.

4. **Sidebar as Client Component** — The sidebar handles the project switcher dropdown (interactive state) and active link highlighting (reads `usePathname`). It receives the project list as props from the server layout.

5. **RLS as the data access layer** — The Supabase client is created with the developer's JWT. RLS policies ensure developers only see their own projects/posts. No additional authorization checks needed in Server Actions beyond confirming the user is authenticated.

6. **Optimistic updates for status changes** — The Roadmap tab uses optimistic UI: status changes appear instantly, roll back on error. This provides a responsive feel without websockets.

---

## Testing Strategy

**Unit Tests:**
- Server Action logic (createProject, updatePostStatus, updateThemeColor, rotateKey, toggleProjectActive) — verify correct Supabase calls, error handling, and return values using mocked Supabase client.
- Middleware route matching — verify redirect behavior for authenticated/unauthenticated requests across various paths.
- Component rendering — verify post cards display correct fields, empty states render, and status columns group correctly.

**Property-Based Tests:**
- Route protection: generate random `/dashboard/*` paths and verify redirect behavior.
- Board sort order: generate random post arrays and verify descending vote_count ordering.
- Status grouping: generate posts with random statuses and verify correct column placement.
- Theme color round-trip: generate random hex colors, save and reload, verify identity.
- Project data isolation: generate multi-project scenarios and verify no data leaks.

**Integration Tests:**
- Auth flow end-to-end (magic link callback, OAuth callback, error callback).
- Project creation → key generation → key rotation lifecycle.
- Status change → changelog update propagation.

**Minimum 100 iterations** per property-based test due to randomization.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Route protection redirects unauthenticated users

*For any* URL path that starts with `/dashboard` (excluding `/dashboard/login` and `/dashboard/auth`), an unauthenticated request SHALL be redirected to `/dashboard/login`.

**Validates: Requirements 2.1**

### Property 2: Active navigation link matches current route

*For any* dashboard route, the sidebar navigation link corresponding to that route SHALL be visually marked as active, and no other link SHALL be marked active.

**Validates: Requirements 3.3**

### Property 3: Project switcher lists all developer projects

*For any* developer with N projects, the project switcher dropdown SHALL contain exactly N project entries (plus the "Create project" option).

**Validates: Requirements 4.2**

### Property 4: Project switch scopes all data to selected project

*For any* project switch from project A to project B, all posts displayed on the Board, Roadmap, and Changelog tabs SHALL belong exclusively to project B.

**Validates: Requirements 4.3**

### Property 5: Valid project name produces a project with publishable key

*For any* non-empty project name submitted by an authenticated developer, the `createProject` action SHALL return a project record containing a `publishable_key` that starts with `feature_poll_pk_`.

**Validates: Requirements 5.2**

### Property 6: Board posts are sorted by vote count descending

*For any* set of posts in a project, the Board tab SHALL display them in descending order of `vote_count` — i.e., for any two adjacent posts in the list, the first has a vote count greater than or equal to the second.

**Validates: Requirements 6.1**

### Property 7: Post card displays all required fields

*For any* post with non-null fields, the rendered post card SHALL include the title, description (or truncation), vote count, and any non-null context metadata (screen_context, os, app_version).

**Validates: Requirements 6.2**

### Property 8: Roadmap groups posts by correct status

*For any* set of posts with various statuses, the Roadmap tab SHALL place each post in the column matching its `status` field — no post appears in a column that does not match its status.

**Validates: Requirements 7.1**

### Property 9: Status update persists for any valid transition

*For any* post and any valid status value, calling `updatePostStatus` SHALL result in the post's status being equal to the new value when subsequently read from the database.

**Validates: Requirements 7.2**

### Property 10: Changelog displays only shipped posts

*For any* project, the Changelog tab SHALL display exactly the posts whose status equals `shipped` — no more, no fewer — each showing title, description, and creation date.

**Validates: Requirements 8.1, 8.2**

### Property 11: Theme color round-trip

*For any* valid hex color string, saving it via `updateThemeColor` and then loading the project's `theme_json` SHALL return the same color value.

**Validates: Requirements 9.2, 9.3**

### Property 12: Rotated key differs from previous key

*For any* key rotation on a project, the new `publishable_key` returned SHALL be different from the previous `publishable_key` and SHALL start with the prefix `feature_poll_pk_`.

**Validates: Requirements 10.3**

### Property 13: Active/inactive toggle persists state

*For any* project, toggling `is_active` to a value and then reading the project SHALL reflect that same `is_active` value.

**Validates: Requirements 10.4**
