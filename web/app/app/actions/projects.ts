"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createProject(name: string, slug?: string, platform?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const publishableKey = `feature_poll_pk_${crypto.randomUUID().replace(/-/g, "")}`;
  const projectSlug = slug?.trim() || generateSlug(name);

  if (!projectSlug) throw new Error("Invalid slug");

  const { data, error } = await supabase
    .from("projects")
    .insert({
      developer_id: user.id,
      name,
      slug: projectSlug,
      publishable_key: publishableKey,
      platform: platform || null,
    })
    .select()
    .single();

  if (error) {
    if (error.message.includes("duplicate") || error.message.includes("unique")) {
      throw new Error("This slug is already taken. Please choose another.");
    }
    throw new Error(error.message);
  }

  revalidatePath("/app");
  return data;
}
