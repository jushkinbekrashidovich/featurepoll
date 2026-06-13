import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validatePublishableKey } from "../_shared/validate-key.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { handleCors } from "../_shared/cors.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const { project, error, status } = await validatePublishableKey(req);
  if (!project) return errorResponse(error!, status);

  const body = await req.json();
  const { title, device_id, description, screen_context, app_version, os } = body;

  // Validate required fields
  if (!title || title.trim() === "") {
    return errorResponse("Title is required", 400);
  }
  if (!device_id) {
    return errorResponse("device_id is required", 400);
  }

  // Rate limit check
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const rateLimitResult = await checkRateLimit(supabase, device_id, project.id, "/posts");
  if (!rateLimitResult.allowed) {
    return errorResponse("Rate limit exceeded", 429);
  }

  // Register device if not exists (silent upsert)
  await supabase
    .from("devices")
    .upsert({ device_id, project_id: project.id }, { onConflict: "device_id" });

  // Insert post
  const { data: post, error: insertError } = await supabase
    .from("posts")
    .insert({
      project_id: project.id,
      title: title.trim(),
      description: description ?? null,
      device_id,
      screen_context: screen_context ?? null,
      app_version: app_version ?? null,
      os: os ?? null,
      status: "open",
    })
    .select("id, title, description, status, vote_count, created_at")
    .single();

  if (insertError) {
    return errorResponse("Failed to create post", 500);
  }

  return jsonResponse({ post }, 201);
});
