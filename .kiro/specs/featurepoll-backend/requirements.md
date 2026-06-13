# Requirements Document

## Introduction

This spec covers Groups 2 + 3 of the FeaturePoll build plan: the backend database schema, Row Level Security policies, SDK-facing API (Edge Functions), publishable key system, and developer authentication. Together these form the source of truth that every client (Flutter SDK, future SDKs, web dashboard) consumes.

## Glossary

- **Backend**: The Supabase-hosted Postgres database, RLS policies, and Edge Functions that serve the FeaturePoll API.
- **Edge_Function**: A Deno/TypeScript serverless handler deployed via Supabase CLI, located in `/backend/functions/`.
- **Migration**: A SQL file in `/backend/migrations/` applied via `supabase db push`.
- **Developer**: A human user who creates projects and manages feature requests via the web dashboard. Authenticated through Supabase Auth.
- **End_User**: An anonymous app user identified solely by a device UUID. Has no account.
- **Project**: A single mobile app registered by a Developer. Owns posts, devices, and a publishable key.
- **Publishable_Key**: A public API key (prefixed `feature_poll_pk_`) shipped inside a mobile app. Scoped to one Project and restricted to SDK-level operations only.
- **Post**: A feature request submitted by an End_User, containing title, description, status, and a denormalized vote count.
- **Vote**: A single upvote by a device on a post. Unique per (post_id, device_id).
- **Device**: An anonymous identity represented by a UUID, optionally holding a push token.
- **Rate_Limit**: A Postgres-based mechanism tracking request counts per device per endpoint within a time window.
- **RLS**: Row Level Security — Postgres policies that restrict row access based on the authenticated context or request headers.
- **Board**: The paginated, vote-sorted list of posts for a given Project, served by the `GET /board` endpoint.

## Requirements

### Requirement 1: Database Schema

**User Story:** As a Developer, I want a well-structured database schema so that projects, posts, votes, and devices are stored reliably with referential integrity.

#### Acceptance Criteria

1. THE Migration SHALL create a `projects` table with columns: `id` (uuid, primary key, default gen_random_uuid()), `developer_id` (uuid, foreign key to auth.users), `name` (text, not null), `platform` (text), `publishable_key` (text, unique, not null), `theme_json` (jsonb), `created_at` (timestamptz, default now()), `is_active` (boolean, default true).
2. THE Migration SHALL create a `posts` table with columns: `id` (uuid, primary key, default gen_random_uuid()), `project_id` (uuid, foreign key to projects, not null), `title` (text, not null), `description` (text), `status` (text, default 'open', check constraint limiting values to 'open', 'planned', 'in_progress', 'shipped', 'declined'), `vote_count` (integer, default 0), `device_id` (uuid, not null), `screen_context` (text), `app_version` (text), `os` (text), `created_at` (timestamptz, default now()).
3. THE Migration SHALL create a `votes` table with columns: `id` (uuid, primary key, default gen_random_uuid()), `post_id` (uuid, foreign key to posts, not null), `device_id` (uuid, not null), `created_at` (timestamptz, default now()), and a UNIQUE constraint on (post_id, device_id).
4. THE Migration SHALL create a `devices` table with columns: `device_id` (uuid, primary key), `project_id` (uuid, foreign key to projects, not null), `push_token` (text, nullable), `first_seen` (timestamptz, default now()).
5. THE Migration SHALL create a `rate_limits` table with columns: `id` (uuid, primary key, default gen_random_uuid()), `device_id` (uuid, not null), `project_id` (uuid, not null), `endpoint` (text, not null), `window_start` (timestamptz, not null), `request_count` (integer, default 1).

### Requirement 2: Vote Count Trigger

**User Story:** As an End_User, I want the vote count on a post to update automatically when votes are cast or removed so that the board always shows accurate counts.

#### Acceptance Criteria

1. WHEN a row is inserted into the `votes` table, THE Backend SHALL increment the `vote_count` column on the corresponding `posts` row by 1.
2. WHEN a row is deleted from the `votes` table, THE Backend SHALL decrement the `vote_count` column on the corresponding `posts` row by 1.
3. THE Migration SHALL implement the vote count synchronization as a Postgres trigger function that fires AFTER INSERT and AFTER DELETE on the `votes` table.

### Requirement 3: Seed Data

**User Story:** As a Developer working on FeaturePoll locally, I want seed data with a test project and sample posts so that I can develop and test without manual setup.

#### Acceptance Criteria

1. THE Migration SHALL insert a test project with a known publishable key (`feature_poll_pk_test_key_123`), name 'Test Project', and `is_active` set to true.
2. THE Migration SHALL insert at least three sample posts for the test project with varying statuses (open, planned, shipped) and non-zero vote counts.
3. THE Migration SHALL insert corresponding device and vote records that are consistent with the sample posts' vote counts.

### Requirement 4: Row Level Security — SDK Access

**User Story:** As a Developer, I want SDK requests to be scoped to only the project matching the publishable key so that one app cannot access another app's data.

#### Acceptance Criteria

1. THE Backend SHALL enable Row Level Security on the `projects`, `posts`, `votes`, `devices`, and `rate_limits` tables.
2. WHEN a request includes a valid publishable key in the request header, THE RLS policies SHALL allow SELECT on `posts` only where `posts.project_id` matches the project associated with the publishable key.
3. WHEN a request includes a valid publishable key in the request header, THE RLS policies SHALL allow INSERT on `posts` only where the new row's `project_id` matches the project associated with the publishable key.
4. WHEN a request includes a valid publishable key in the request header, THE RLS policies SHALL allow INSERT and DELETE on `votes` only for posts belonging to the project associated with the publishable key.
5. WHEN a request includes a valid publishable key in the request header, THE RLS policies SHALL allow INSERT and UPDATE on `devices` only where `devices.project_id` matches the project associated with the publishable key.
6. THE RLS policies SHALL prevent SDK requests from performing UPDATE on `posts.status` column.
7. THE RLS policies SHALL prevent SDK requests from performing any write operation on the `projects` table.

### Requirement 5: Row Level Security — Developer (Admin) Access

**User Story:** As a Developer, I want to manage only my own projects and their posts so that other developers' data remains private.

#### Acceptance Criteria

1. WHILE a Developer is authenticated via Supabase Auth, THE RLS policies SHALL allow SELECT, INSERT, UPDATE, and DELETE on `projects` only where `projects.developer_id` equals the authenticated user's ID.
2. WHILE a Developer is authenticated via Supabase Auth, THE RLS policies SHALL allow SELECT and UPDATE on `posts` only where `posts.project_id` belongs to a project owned by the authenticated Developer.
3. WHILE a Developer is authenticated via Supabase Auth, THE RLS policies SHALL allow SELECT on `votes` and `devices` only where the related `project_id` belongs to a project owned by the authenticated Developer.
4. THE RLS policies SHALL prevent any authenticated Developer from accessing rows belonging to projects owned by a different Developer.

### Requirement 6: SDK-Facing API — Get Board

**User Story:** As an End_User viewing the feature board in a mobile app, I want to see a paginated list of posts sorted by votes so that the most popular requests appear first.

#### Acceptance Criteria

1. WHEN a GET request is received at the `/board` endpoint with a valid publishable key header, THE Edge_Function SHALL return posts for the corresponding project sorted by `vote_count` descending.
2. THE Edge_Function SHALL support pagination via `page` and `page_size` query parameters, defaulting to page 1 and page_size 20.
3. THE Edge_Function SHALL return each post with fields: `id`, `title`, `description`, `status`, `vote_count`, `created_at`.
4. IF the publishable key header is missing or does not match any active project, THEN THE Edge_Function SHALL return HTTP 401 with an error message.

### Requirement 7: SDK-Facing API — Create Post

**User Story:** As an End_User, I want to submit a feature request from within the app so that the developer knows what I need.

#### Acceptance Criteria

1. WHEN a POST request is received at the `/posts` endpoint with a valid publishable key header and a body containing `title`, `device_id`, and optionally `description`, `screen_context`, `app_version`, and `os`, THE Edge_Function SHALL insert a new post with status 'open' and return the created post.
2. IF the `title` field is missing or empty, THEN THE Edge_Function SHALL return HTTP 400 with a validation error message.
3. IF the `device_id` field is missing, THEN THE Edge_Function SHALL return HTTP 400 with a validation error message.
4. THE Edge_Function SHALL check the rate limit for the device on the `/posts` endpoint before processing, and IF the limit is exceeded, THEN THE Edge_Function SHALL return HTTP 429.

### Requirement 8: SDK-Facing API — Cast Vote

**User Story:** As an End_User, I want to upvote a feature request so that the developer sees which features are most wanted.

#### Acceptance Criteria

1. WHEN a POST request is received at the `/votes` endpoint with a valid publishable key header and a body containing `post_id` and `device_id`, THE Edge_Function SHALL insert a vote record.
2. WHEN the device has already voted on the specified post, THE Edge_Function SHALL return the existing vote without creating a duplicate (idempotent behavior).
3. IF the `post_id` does not belong to the project associated with the publishable key, THEN THE Edge_Function SHALL return HTTP 403.
4. THE Edge_Function SHALL check the rate limit for the device on the `/votes` endpoint before processing, and IF the limit is exceeded, THEN THE Edge_Function SHALL return HTTP 429.

### Requirement 9: SDK-Facing API — Remove Vote

**User Story:** As an End_User, I want to remove my vote from a post so that I can change my mind.

#### Acceptance Criteria

1. WHEN a DELETE request is received at the `/votes` endpoint with a valid publishable key header and a body containing `post_id` and `device_id`, THE Edge_Function SHALL delete the matching vote record.
2. IF no matching vote exists for the given `post_id` and `device_id`, THEN THE Edge_Function SHALL return HTTP 200 (no-op, idempotent).
3. IF the `post_id` does not belong to the project associated with the publishable key, THEN THE Edge_Function SHALL return HTTP 403.

### Requirement 10: SDK-Facing API — Register Device

**User Story:** As an End_User opening the app for the first time, I want my device to be registered so that I can receive push notifications when features I voted for ship.

#### Acceptance Criteria

1. WHEN a POST request is received at the `/devices` endpoint with a valid publishable key header and a body containing `device_id` and optionally `push_token`, THE Edge_Function SHALL insert a new device record or update the existing device's `push_token`.
2. IF the `device_id` field is missing, THEN THE Edge_Function SHALL return HTTP 400 with a validation error message.
3. THE Edge_Function SHALL use an upsert operation on `device_id` so that repeated calls update the push token without creating duplicates.

### Requirement 11: Publishable Key Validation

**User Story:** As a Developer, I want every SDK request to be validated against the publishable key so that disabled or unknown keys are rejected.

#### Acceptance Criteria

1. THE Edge_Function SHALL extract the publishable key from the `x-publishable-key` request header on every SDK endpoint.
2. IF the header is missing, THEN THE Edge_Function SHALL return HTTP 401 with error message "Missing publishable key".
3. IF the key does not match any row in the `projects` table, THEN THE Edge_Function SHALL return HTTP 401 with error message "Invalid publishable key".
4. IF the matching project has `is_active` set to false, THEN THE Edge_Function SHALL return HTTP 401 with error message "Project is disabled".

### Requirement 12: Rate Limiting

**User Story:** As a Developer, I want POST endpoints to be rate-limited per device so that abuse and spam are prevented.

#### Acceptance Criteria

1. WHEN a POST request is received at the `/posts` or `/votes` endpoint, THE Edge_Function SHALL check the `rate_limits` table for the device's request count within the current time window (60-second window).
2. IF the request count for the device on the given endpoint exceeds the configured limit (10 requests per window for `/posts`, 30 requests per window for `/votes`), THEN THE Edge_Function SHALL return HTTP 429 with error message "Rate limit exceeded".
3. WHEN the request is within the rate limit, THE Edge_Function SHALL increment the request count for the device and endpoint in the `rate_limits` table.
4. WHEN the current time exceeds the `window_start` plus the window duration, THE Edge_Function SHALL reset the `request_count` to 1 and update the `window_start` to the current time.

### Requirement 13: Publishable Key Generation

**User Story:** As a Developer creating a new project, I want a publishable key to be automatically generated so that I can immediately use it in my mobile app.

#### Acceptance Criteria

1. WHEN a new project is inserted into the `projects` table, THE Backend SHALL generate a publishable key with the prefix `feature_poll_pk_` followed by 32 cryptographically random alphanumeric characters.
2. THE Backend SHALL store the generated key in the `publishable_key` column of the new project row.
3. THE Backend SHALL enforce uniqueness of the `publishable_key` column via a database constraint.

### Requirement 14: Key Rotation

**User Story:** As a Developer, I want to rotate my project's publishable key so that I can invalidate a compromised key without deleting the project.

#### Acceptance Criteria

1. WHEN a Developer requests key rotation for a project they own, THE Backend SHALL generate a new publishable key with the same format (`feature_poll_pk_` + 32 random characters) and replace the old key.
2. WHEN the new key is saved, THE Backend SHALL immediately invalidate the old key so that SDK requests using the old key receive HTTP 401.

### Requirement 15: Key Disabling

**User Story:** As a Developer, I want to disable my project's key without deleting the project so that I can temporarily block all SDK traffic.

#### Acceptance Criteria

1. WHEN a Developer sets `is_active` to false on a project they own, THE Backend SHALL cause all SDK requests using that project's publishable key to be rejected with HTTP 401.
2. WHEN a Developer sets `is_active` back to true, THE Backend SHALL resume accepting SDK requests using that project's publishable key.

### Requirement 16: Developer Authentication

**User Story:** As a Developer, I want to authenticate via Supabase Auth so that I can securely manage my projects.

#### Acceptance Criteria

1. THE Backend SHALL use Supabase Auth for developer authentication, supporting email/password and OAuth sign-in methods.
2. WHEN a Developer creates a project, THE Backend SHALL set the `developer_id` column to the authenticated user's ID from Supabase Auth.
3. THE Backend SHALL enforce that a Developer can own multiple projects, each linked via the `developer_id` foreign key to `auth.users.id`.

### Requirement 17: CORS and Request Headers

**User Story:** As an SDK client, I want the API to accept cross-origin requests and recognize the publishable key header so that mobile and web clients can reach the endpoints.

#### Acceptance Criteria

1. THE Edge_Function SHALL include CORS headers allowing requests from any origin for SDK endpoints.
2. THE Edge_Function SHALL accept the `x-publishable-key` custom header in preflight (OPTIONS) responses.
3. WHEN an OPTIONS request is received, THE Edge_Function SHALL return HTTP 200 with appropriate CORS headers and an empty body.
