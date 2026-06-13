import { createClient } from "@/lib/supabase/server";
import { PostCard } from "@/components/dashboard/post-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import type { Post } from "@/lib/types";

interface BoardPageProps {
  searchParams: Promise<{ project?: string }>;
}

export default async function BoardPage({ searchParams }: BoardPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  // Get active project
  let projectId = params.project;
  if (!projectId) {
    const { data: projects } = await supabase
      .from("projects")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1);
    projectId = projects?.[0]?.id;
  }

  if (!projectId) {
    return (
      <EmptyState
        title="No projects yet"
        description="Create your first project to start collecting feature requests."
      />
    );
  }

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("project_id", projectId)
    .order("vote_count", { ascending: false });

  const typedPosts = (posts ?? []) as Post[];

  return (
    <div>
      <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
        Board
      </h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Feature requests sorted by popularity
      </p>

      <div className="mt-6 space-y-3">
        {typedPosts.length === 0 ? (
          <EmptyState
            title="No feature requests yet"
            description="Requests from your app users will appear here once they start submitting."
          />
        ) : (
          typedPosts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
