# Implementation Plan: FeaturePoll Backend

## Overview

Build the FeaturePoll backend as local files: SQL migrations (schema, triggers, RLS, seed) and Deno Edge Functions with shared utilities. The user deploys to Supabase separately. All Edge Functions use the Deno runtime with imports from `esm.sh` and `deno.land`.

## Tasks

- [x] 1. Create SQL migrations
  - [x] 1.1 Create database schema migration (`/backend/migrations/001_schema.sql`)
    - Create `projects` table with all columns, types, and constraints (uuid PK, developer_id FK to auth.users, publishable_key UNIQUE NOT NULL, is_active default true)
    - Create `posts` table with status CHECK constraint ('open','planned','in_progress','shipped','declined'), vote_count default 0, project_id FK
    - Create `votes` table with UNIQUE(post_id, device_id) constraint
    - Create `devices` table with device_id as PK (not auto-generated), project_id FK
    - Create `rate_limits` table with device_id, project_id, endpoint, window_start, request_count
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 1.2 Create vote count trigger migration (`/backend/migrations/002_triggers.sql`)
    - Create `update_vote_count()` trigger function that increments vote_count on INSERT and decrements on DELETE
    - Create AFTER INSERT OR DELETE trigger on votes table that calls the function
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 1.3 Create RLS policies migration (`/backend/migrations/003_rls_policies.sql`)
    - Enable RLS on all five tables (projects, posts, votes, devices, rate_limits)
    - Create `get_project_id_from_key()` helper function (SECURITY DEFINER, reads x-publishable-key header)
    - Create admin/developer policies using `auth.uid()`: developers_own_projects, developers_manage_posts, developers_read_votes, developers_read_devices
    - Create SDK policies: sdk_read_posts, sdk_insert_posts, sdk_insert_votes, sdk_delete_votes, sdk_manage_devices
    - Ensure NO SDK policy allows UPDATE on posts.status or writes on projects table
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.1, 5.2, 5.3, 5.4_

  - [x] 1.4 Create seed data migration (`/backend/migrations/004_seed.sql`)
    - Insert test project with known publishable key `feature_poll_pk_test_key_123` and is_active=true
    - Insert at least 3 sample posts with varying statuses (open, planned, shipped) and non-zero vote_counts
    - Insert corresponding device and vote records consistent with the post vote_counts
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 2. Implement shared Edge Function utilities
  - [x] 2.1 Create CORS utility (`/backend/functions/_shared/cors.ts`)
    - Export `corsHeaders` object with Access-Control-Allow-Origin: *, allowed headers including x-publishable-key, allowed methods GET/POST/DELETE/OPTIONS
    - Export `handleCors(req)` function that returns a 200 Response for OPTIONS requests, or null otherwise
    - _Requirements: 17.1, 17.2, 17.3_

  - [x] 2.2 Create response helpers (`/backend/functions/_shared/response.ts`)
    - Export `jsonResponse(data, status)` that returns a JSON Response with corsHeaders
    - Export `errorResponse(message, status)` that returns a JSON error Response with corsHeaders
    - _Requirements: 17.1_

  - [x] 2.3 Create publishable key validation utility (`/backend/functions/_shared/validate-key.ts`)
    - Export `validatePublishableKey(req)` that extracts x-publishable-key header, queries projects table via service_role client
    - Return 401 with "Missing publishable key" if header absent
    - Return 401 with "Invalid publishable key" if key not found
    - Return 401 with "Project is disabled" if is_active=false
    - Return resolved project (id, name, developer_id) on success
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 2.4 Create rate limit utility (`/backend/functions/_shared/rate-limit.ts`)
    - Export `checkRateLimit(supabase, deviceId, projectId, endpoint)` function
    - Implement 60-second sliding window with configurable limits (10 for /posts, 30 for /votes)
    - Insert new record if no existing record in window, increment count if within limit, reject if over limit
    - Reset window_start and count when window expires
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 3. Checkpoint — Verify migrations and shared utilities
  - Ensure all migration files are syntactically correct SQL. Ensure all shared utility files are valid TypeScript with proper Deno imports. Ask the user if questions arise.

- [x] 4. Implement SDK-facing Edge Functions
  - [x] 4.1 Create board Edge Function (`/backend/functions/board/index.ts`)
    - Handle CORS preflight via shared utility
    - Validate publishable key, return 401 on failure
    - Parse `page` and `page_size` query params (defaults: page=1, page_size=20, max page_size=100)
    - Query posts for the resolved project_id, ordered by vote_count DESC, with range-based pagination
    - Return { posts, page, page_size } response
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 11.1, 11.2, 11.3, 11.4_

  - [x] 4.2 Create posts Edge Function (`/backend/functions/posts/index.ts`)
    - Handle CORS preflight and validate publishable key
    - Validate required fields: title (non-empty after trim) and device_id — return 400 if missing
    - Check rate limit for device on /posts endpoint — return 429 if exceeded
    - Upsert device record (silent registration)
    - Insert post with project_id, trimmed title, optional fields, status='open'
    - Return created post with 201 status
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 11.1, 12.1, 12.2_

  - [x] 4.3 Create votes Edge Function (`/backend/functions/votes/index.ts`)
    - Handle CORS preflight and validate publishable key
    - Validate required fields: post_id and device_id — return 400 if missing
    - Verify post belongs to the resolved project — return 403 if not
    - POST: check rate limit on /votes, upsert vote (idempotent via onConflict), return 201
    - DELETE: delete matching vote (idempotent, no error if not found), return 200
    - Return 405 for unsupported methods
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 11.1, 12.1, 12.2_

  - [x] 4.4 Create devices Edge Function (`/backend/functions/devices/index.ts`)
    - Handle CORS preflight and validate publishable key
    - Validate required field: device_id — return 400 if missing
    - Upsert device with project_id and optional push_token (onConflict: device_id)
    - Return device record with 200 status
    - _Requirements: 10.1, 10.2, 10.3, 11.1_

  - [x] 4.5 Create rotate-key Edge Function (`/backend/functions/rotate-key/index.ts`)
    - Handle CORS preflight
    - Authenticate developer via Authorization header (Bearer JWT), verify with supabase.auth.getUser — return 401 if invalid
    - Validate required field: project_id — return 400 if missing
    - Verify developer owns the project — return 403 if not
    - Generate new publishable key (`feature_poll_pk_` + 32 crypto-random alphanumeric chars)
    - Update project row with new key, return new key in response
    - _Requirements: 14.1, 14.2, 16.1, 16.2_

- [x] 5. Checkpoint — Verify all Edge Functions
  - Ensure all Edge Function files are valid TypeScript with correct Deno imports. Verify each function handles CORS, key validation (or JWT auth for rotate-key), input validation, and error cases. Ask the user if questions arise.

- [ ]* 6. Write property-based tests for core logic
  - [ ]* 6.1 Write property test for vote count invariant
    - **Property 1: Vote Count Invariant** — For any sequence of vote inserts/deletes on a post, vote_count equals COUNT(*) of votes for that post
    - **Validates: Requirements 2.1, 2.2, 2.3**

  - [ ]* 6.2 Write property test for vote idempotence
    - **Property 8: Vote Idempotence** — For any (post_id, device_id) pair, N repeated POST /votes calls result in exactly one vote row
    - **Validates: Requirements 8.1, 8.2**

  - [ ]* 6.3 Write property test for rate limit enforcement
    - **Property 11: Rate Limit Enforcement** — For any device exceeding the configured limit within a 60s window, subsequent requests return 429
    - **Property 12: Rate Limit Window Reset** — After window expires, next request resets counter and succeeds
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4**

  - [ ]* 6.4 Write property test for pagination correctness
    - **Property 5: Board Sort Order** — Response posts are in non-increasing vote_count order
    - **Property 6: Pagination Correctness** — Pages contain at most page_size items with no overlap between consecutive pages
    - **Validates: Requirements 6.1, 6.2**

  - [ ]* 6.5 Write property test for publishable key format
    - **Property 13: Publishable Key Format** — Generated keys match `^feature_poll_pk_[a-zA-Z0-9]{32}$`
    - **Validates: Requirements 13.1, 14.1**

  - [ ]* 6.6 Write property test for device upsert idempotence
    - **Property 10: Device Upsert Idempotence** — N calls for the same device_id result in exactly one row, with push_token from the latest call
    - **Validates: Requirements 10.1, 10.3**

- [x] 7. Final checkpoint — Ensure all files are complete
  - Ensure all migration files and Edge Function files are created and internally consistent. Verify imports between shared utilities and functions are correct. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- All Edge Functions use the Deno runtime (`serve` from deno.land/std, `createClient` from esm.sh/@supabase/supabase-js@2)
- Edge Functions use the `service_role` key internally to bypass RLS — project scoping is enforced in application code
- The rotate-key function is the only endpoint using JWT auth (developer-only); all others use publishable key auth
- Deployment to Supabase is handled separately by the user — these tasks only create local files

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.4"] },
    { "id": 2, "tasks": ["1.3", "2.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "2.4"] },
    { "id": 4, "tasks": ["4.1", "4.4", "4.5"] },
    { "id": 5, "tasks": ["4.2", "4.3"] },
    { "id": 6, "tasks": ["6.1", "6.2", "6.3", "6.4", "6.5", "6.6"] }
  ]
}
```
