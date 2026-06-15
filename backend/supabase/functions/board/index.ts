import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validatePublishableKey } from "../_shared/validate-key.ts";
import { handleCors } from "../_shared/cors.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Validate publishable key
  const { project, error, status } = await validatePublishableKey(req);
  if (!project) return errorResponse(error!, status);

  // Parse params
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("page_size") ?? "20")));
  const offset = (page - 1) * pageSize;
  const deviceId = url.searchParams.get("device_id");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Query posts
  const { data: posts, error: queryError } = await supabase
    .from("posts")
    .select("id, title, description, status, vote_count, created_at")
    .eq("project_id", project.id)
    .order("vote_count", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (queryError) {
    return errorResponse("Failed to fetch posts", 500);
  }

  // If device_id provided, check which posts this device has voted on
  let votedPostIds: string[] = [];
  if (deviceId && posts && posts.length > 0) {
    const postIds = posts.map((p: { id: string }) => p.id);
    const { data: votes } = await supabase
      .from("votes")
      .select("post_id")
      .eq("device_id", deviceId)
      .in("post_id", postIds);

    votedPostIds = (votes ?? []).map((v: { post_id: string }) => v.post_id);
  }

  // Add voted_by_device flag to each post
  const postsWithVoteStatus = (posts ?? []).map((post: { id: string }) => ({
    ...post,
    voted_by_device: votedPostIds.includes(post.id),
  }));

  return jsonResponse({ posts: postsWithVoteStatus, page, page_size: pageSize });
});
