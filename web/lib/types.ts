export interface Project {
  id: string;
  developer_id: string;
  name: string;
  slug: string;
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
