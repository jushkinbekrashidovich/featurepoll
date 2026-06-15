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

export async function deletePost(postId: string) {
  const supabase = await createClient();

  // Delete votes first (foreign key constraint)
  await supabase.from("votes").delete().eq("post_id", postId);

  const { error } = await supabase.from("posts").delete().eq("id", postId);

  if (error) throw new Error(error.message);

  revalidatePath("/app", "layout");
  return { success: true };
}

export async function createPost(projectId: string, title: string, description: string, status: PostStatus) {
  if (!title.trim()) throw new Error("Title is required");
  if (!validStatuses.includes(status)) throw new Error("Invalid status");

  const supabase = await createClient();

  const { error } = await supabase
    .from("posts")
    .insert({
      project_id: projectId,
      title: title.trim(),
      description: description.trim() || null,
      status,
      device_id: "00000000-0000-0000-0000-000000000000",
    });

  if (error) throw new Error(error.message);

  revalidatePath("/app", "layout");
  return { success: true };
}
