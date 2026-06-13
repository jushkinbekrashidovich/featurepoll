"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createProject(name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const publishableKey = `feature_poll_pk_${crypto.randomUUID().replace(/-/g, "")}`;

  const { data, error } = await supabase
    .from("projects")
    .insert({
      developer_id: user.id,
      name,
      publishable_key: publishableKey,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  return data;
}
