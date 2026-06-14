"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateThemeColor(projectId: string, accentColor: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("projects")
    .update({ theme_json: { accent_color: accentColor } })
    .eq("id", projectId);

  if (error) throw new Error(error.message);

  revalidatePath("/app", "layout");
  return { success: true };
}

export async function rotateKey(projectId: string) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Unauthorized");

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/rotate-key`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ project_id: projectId }),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to rotate key");
  }

  const { publishable_key } = await response.json();

  revalidatePath("/app", "layout");
  return { publishable_key };
}

export async function toggleProjectActive(projectId: string, isActive: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("projects")
    .update({ is_active: isActive })
    .eq("id", projectId);

  if (error) throw new Error(error.message);

  revalidatePath("/app", "layout");
  return { success: true };
}
