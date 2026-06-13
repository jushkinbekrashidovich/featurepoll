# Tech — FeaturePoll

## Stack
- **Backend + DB:** Supabase — Postgres, auto REST API (PostgREST), Edge Functions for custom logic, Row Level Security (RLS) for per-project isolation, Supabase Auth for developer accounts.
- **Web (landing page + dashboard):** Next.js (App Router) + Tailwind CSS. One codebase. Deployed on Vercel. Landing page is mostly static and SEO-focused.
- **SDK:** pure Dart/Flutter package (`feature_poll`). Open source, MIT. Networking via `http` or `dio`; local cache via `hive` or `sqflite`; device IDs via `uuid`; app metadata via `package_info_plus`.
- **Push:** Firebase Cloud Messaging (FCM), triggered from a Supabase Edge Function when a post's status changes to `shipped`.
- **Languages:** only two — Dart (SDK) and TypeScript (web). Keep it that way.

## Architecture
Four components around one source of truth:
- **Flutter SDK** (in the user's app) — renders the board, captures votes, caches locally, syncs. Talks to the backend using ONLY the publishable key.
- **Backend API** (Supabase) — validates publishable keys, serves board data, records votes, enforces per-project isolation, sends push.
- **Web dashboard** (Next.js) — developers log in (real auth) to create projects, get keys, read requests, change statuses, mark shipped.
- **Landing page** (Next.js) — marketing, docs, email capture. Static and fast.

The backend is the single source of truth. Every future SDK (React Native, iOS, Kotlin) is a thin client over the SAME API with the SAME publishable-key model. Build the backend cleanly once; platform expansion is additive, never a rewrite.

## Data model
- **projects** — `id`, `developer_id`, `name`, `platform`, `publishable_key`, `theme_json`, `created_at`.
- **posts** — `id`, `project_id`, `title`, `description`, `status`, `vote_count` (denormalized), `device_id` (author), `screen_context`, `app_version`, `os`, `created_at`.
- **votes** — `id`, `post_id`, `device_id`, `created_at`. **UNIQUE (post_id, device_id).**
- **devices** — `device_id` (uuid), `project_id`, `push_token` (nullable), `first_seen`.
- Developer accounts handled by Supabase Auth; a developer owns many projects.
- v2 tables (do not create yet): `comments`, `changelog_entries`, `tags`.

## Security rules (non-negotiable)
- The publishable key ships inside the app and is PUBLIC. It must be scoped so it can only read/write rows for its own `project_id`, and can NEVER perform admin actions (no status changes, no project edits, no reading other projects).
- RLS is enabled on every table.
- Developer (dashboard) auth is separate from the publishable key and governs all admin actions.
- Rate-limit vote/post endpoints per device to prevent abuse.
- Never commit secrets. Supabase service keys and FCM credentials live in environment variables / a secrets manager only.

## SDK public API (keep this surface tiny)
- `FeaturePoll.init(publishableKey)` — call once at startup.
- `FeaturePoll.openBoard(context)` — open the board screen.
- A config object for optional theme overrides and a flag to disable context capture (privacy).
That's the whole surface. Resist adding more.

## SDK behavior rules
- **Local-first:** render the board instantly from local cache, then refresh in the background (stale-while-revalidate). No spinner when a cache exists.
- **Optimistic voting:** update the UI immediately; queue the network call; flush the queue when connectivity returns.
- **Theme:** inherit the host app's `ThemeData` (colors, fonts, dark mode) by default; allow overrides via config.
- **Privacy:** honor the capture-off flag; collect no personal data; identity is a random device UUID only.

## Conventions
- Dart: follow `flutter_lints`; format with `dart format`; document the public API.
- TypeScript: standard Next.js + Tailwind conventions; components small and composable.
- Commits: conventional commits. Each Kiro task should map to one focused change set.
- Tests: unit-test the SDK sync queue and vote idempotency; integration-test the backend isolation (one project cannot read another's data).
