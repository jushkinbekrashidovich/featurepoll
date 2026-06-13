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
