# /backend — Supabase Backend

Home of Supabase migrations and Edge Functions for the FeaturePoll API.

- **Database:** PostgreSQL with Row Level Security (RLS)
- **API:** PostgREST auto-generated + custom Edge Functions
- **Auth:** Supabase Auth for developer accounts
- **Push:** Edge Function triggers for FCM notifications

## Structure (planned)

```
/migrations                # SQL schema + RLS policies
/functions                 # Edge Functions (board API, push on shipped)
seed.sql                   # Test project + sample posts
```
