-- FeaturePoll Schema Migration
-- Creates all core tables for the application

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

-- Indexes for common query patterns
CREATE INDEX idx_posts_project_id ON posts(project_id);
CREATE INDEX idx_posts_vote_count ON posts(project_id, vote_count DESC);
CREATE INDEX idx_votes_post_id ON votes(post_id);
CREATE INDEX idx_votes_device_id ON votes(device_id);
CREATE INDEX idx_devices_project_id ON devices(project_id);
CREATE INDEX idx_rate_limits_lookup ON rate_limits(device_id, project_id, endpoint, window_start);
