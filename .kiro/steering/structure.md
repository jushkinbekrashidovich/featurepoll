# Structure — FeaturePoll

## Repository layout
Monorepo for now. The `/sdk` folder will be split into its own public repository before publishing to pub.dev.

```
/featurepoll
  /sdk          Flutter package "feature_poll" (open source, MIT)
    /lib
      feature_poll.dart        public entrypoint (exports the API)
      /src
        /api                   networking client + typed models
        /board                 board UI widgets (list, submit sheet, roadmap)
        /cache                 local store + sync queue
        /core                  device id, config, context capture
    /example                   runnable demo app (the "3 lines" proof)
    /test
    pubspec.yaml
    README.md                  quickstart with GIFs

  /backend      Supabase project
    /migrations                SQL schema + RLS policies
    /functions                 Edge Functions (board API, push on shipped)
    seed.sql                   test project + sample posts

  /web          Next.js app (landing page + dashboard)
    /app
      /(marketing)             landing page routes (mostly static)
      /dashboard               authed developer area
    /components
    /lib                       supabase client, api helpers

  /docs         project bible, specs notes, decisions
  .kiro
    /steering                  product.md, tech.md, structure.md (this file)
    /specs                     one folder per build group
```

## Where things go
- **SDK networking/models** → `/sdk/lib/src/api`.
- **SDK board screens/widgets** → `/sdk/lib/src/board`.
- **SDK caching + offline sync** → `/sdk/lib/src/cache`.
- **SDK device id, config, context capture** → `/sdk/lib/src/core`.
- **Only the public API** is exported from `/sdk/lib/feature_poll.dart`. Everything under `/src` is internal.
- **Database schema and RLS** → `/backend/migrations`. Never define schema anywhere else.
- **Custom backend logic** (key validation beyond RLS, push-on-shipped) → `/backend/functions`.
- **Landing page** → `/web/app/(marketing)`. Keep it static-renderable for SEO and speed.
- **Dashboard** → `/web/app/dashboard`, behind auth.

## Naming & boundaries
- Public Dart API uses `FeaturePoll` (class) / `feature_poll` (package). Internal classes are not exported.
- The SDK NEVER imports backend/dashboard code; it only knows the public HTTP API and the publishable key.
- The dashboard and landing page share components in `/web/components` but keep marketing and authed code in separate route groups.
- Each Kiro spec lives in `.kiro/specs/<group-name>/` and maps to one build group from the project plan.

## Build order reminder
Landing page can be built in parallel. Critical path: backend → keys/projects → SDK → board UI → dashboard → push → launch. Win Flutter deeply before any second platform.
