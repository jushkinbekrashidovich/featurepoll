"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type PostStatus = "open" | "planned" | "in_progress" | "shipped" | "declined";

const validStatuses: PostStatus[] = ["open", "planned", "in_progress", "shipped", "declined"];

export async function updatePostStatus(postId: string, status: PostStatus) {
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("posts")
    .update({ status })
    .eq("id", postId);

  if (error) throw new Error(error.message);

  revalidatePath("/app", "layout");
  return { success: true };
}
