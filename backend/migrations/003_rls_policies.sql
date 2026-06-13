-- 003_rls_policies.sql
-- Enable Row Level Security and create access policies for all tables.
-- Two policy groups: Admin (auth.uid()-based) and SDK (publishable key-based).

-- =============================================================
-- Enable RLS on all tables
-- =============================================================

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
