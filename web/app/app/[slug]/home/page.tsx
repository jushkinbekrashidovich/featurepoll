import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BoardHeader } from "@/components/app/board-header";
import { KanbanBoard } from "@/components/app/kanban-board";
import type { Post } from "@/lib/types";

interface HomePageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectHomePage({ params }: HomePageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Resolve project by slug or ID
  let projectId: string | undefined;
  const { data: projectBySlug } = await supabase
    .from("projects")
    .select("id")
    .eq("slug", slug)
    .single();

  if (projectBySlug) {
    projectId = projectBySlug.id;
  } else {
    const { data: projectById } = await supabase
      .from("projects")
      .select("id")
      .eq("id", slug)
      .single();
    projectId = projectById?.id;
  }

  if (!projectId) redirect("/app");

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("project_id", projectId)
    .order("vote_count", { ascending: false });

  const typedPosts = (posts ?? []) as Post[];

  return (
    <div>
      <BoardHeader projectId={projectId} />
      <div className="mt-6">
        <KanbanBoard initialPosts={typedPosts} />
      </div>
    </div>
  );
}
