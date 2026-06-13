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

  // Parse pagination params
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("page_size") ?? "20")));
  const offset = (page - 1) * pageSize;

  // Query posts
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: posts, error: queryError } = await supabase
    .from("posts")
    .select("id, title, description, status, vote_count, created_at")
    .eq("project_id", project.id)
    .order("vote_count", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (queryError) {
    return errorResponse("Failed to fetch posts", 500);
  }

  return jsonResponse({ posts, page, page_size: pageSize });
});
