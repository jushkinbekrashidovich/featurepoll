import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors } from "../_shared/cors.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

function generatePublishableKey(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => chars[b % chars.length])
    .join("");
  return `feature_poll_pk_${randomPart}`;
}

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Authenticate developer via JWT
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return errorResponse("Authorization required", 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Verify the JWT and get user
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return errorResponse("Invalid authentication", 401);
  }

  const body = await req.json();
  const { project_id } = body;

  if (!project_id) {
    return errorResponse("project_id is required", 400);
  }

  // Verify developer owns this project
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", project_id)
    .eq("developer_id", user.id)
    .single();

  if (!project) {
    return errorResponse("Project not found or not owned by you", 403);
  }

  // Generate and save new key
  const newKey = generatePublishableKey();
  const { error: updateError } = await supabase
    .from("projects")
    .update({ publishable_key: newKey })
    .eq("id", project_id);

  if (updateError) {
    return errorResponse("Failed to rotate key", 500);
  }

  return jsonResponse({ publishable_key: newKey });
});
