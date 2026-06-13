import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validatePublishableKey } from "../_shared/validate-key.ts";
import { handleCors } from "../_shared/cors.ts";
import { jsonResponse, errorResponse } from "../_shared/response.ts";

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const { project, error, status } = await validatePublishableKey(req);
  if (!project) return errorResponse(error!, status);

  const body = await req.json();
  const { device_id, push_token } = body;

  if (!device_id) {
    return errorResponse("device_id is required", 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: device, error: upsertError } = await supabase
    .from("devices")
    .upsert(
      {
        device_id,
        project_id: project.id,
        push_token: push_token ?? null,
      },
      { onConflict: "device_id" }
    )
    .select("device_id, project_id, push_token, first_seen")
    .single();

  if (upsertError) {
    return errorResponse("Failed to register device", 500);
  }

  return jsonResponse({ device }, 200);
});
