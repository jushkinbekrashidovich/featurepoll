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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const body = await req.json();
  const { post_id, device_id } = body;

  if (!post_id || !device_id) {
    return errorResponse("post_id and device_id are required", 400);
  }

  // Verify post belongs to this project
  const { data: post } = await supabase
    .from("posts")
    .select("id")
    .eq("id", post_id)
    .eq("project_id", project.id)
    .single();

  if (!post) {
    return errorResponse("Post not found or does not belong to this project", 403);
  }

  if (req.method === "POST") {
    // Rate limit check for voting
    const rateLimitResult = await checkRateLimit(supabase, device_id, project.id, "/votes");
    if (!rateLimitResult.allowed) {
      return errorResponse("Rate limit exceeded", 429);
    }

    // Upsert vote (idempotent — returns existing if already voted)
    const { data: vote, error: voteError } = await supabase
      .from("votes")
      .upsert(
        { post_id, device_id },
        { onConflict: "post_id,device_id" }
      )
      .select("id, post_id, device_id, created_at")
      .single();

    if (voteError) {
      return errorResponse("Failed to cast vote", 500);
    }

    return jsonResponse({ vote }, 201);
  }

  if (req.method === "DELETE") {
    // Delete vote (idempotent — no error if not found)
    await supabase
      .from("votes")
      .delete()
      .eq("post_id", post_id)
      .eq("device_id", device_id);

    return jsonResponse({ message: "Vote removed" }, 200);
  }

  return errorResponse("Method not allowed", 405);
});
