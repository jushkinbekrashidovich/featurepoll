import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const LIMITS: Record<string, number> = {
  "/posts": 10,
  "/votes": 30,
};

const WINDOW_SECONDS = 60;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export async function checkRateLimit(
  supabase: SupabaseClient,
  deviceId: string,
  projectId: string,
  endpoint: string
): Promise<RateLimitResult> {
  const limit = LIMITS[endpoint] ?? 10;
  const now = new Date();
  const windowStart = new Date(now.getTime() - WINDOW_SECONDS * 1000);

  // Check existing rate limit record within the current window
  const { data: existing } = await supabase
    .from("rate_limits")
    .select("id, request_count, window_start")
    .eq("device_id", deviceId)
    .eq("project_id", projectId)
    .eq("endpoint", endpoint)
    .gte("window_start", windowStart.toISOString())
    .single();

  if (!existing) {
    // No record in current window — create new one
    await supabase.from("rate_limits").insert({
      device_id: deviceId,
      project_id: projectId,
      endpoint,
      window_start: now.toISOString(),
      request_count: 1,
    });
    return { allowed: true, remaining: limit - 1 };
  }

  // Check if window has expired
  const recordWindowStart = new Date(existing.window_start);
  const windowEnd = new Date(recordWindowStart.getTime() + WINDOW_SECONDS * 1000);

  if (now > windowEnd) {
    // Window expired — reset
    await supabase
      .from("rate_limits")
      .update({ request_count: 1, window_start: now.toISOString() })
      .eq("id", existing.id);
    return { allowed: true, remaining: limit - 1 };
  }

  if (existing.request_count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  // Increment count
  await supabase
    .from("rate_limits")
    .update({ request_count: existing.request_count + 1 })
    .eq("id", existing.id);

  return { allowed: true, remaining: limit - existing.request_count - 1 };
}
