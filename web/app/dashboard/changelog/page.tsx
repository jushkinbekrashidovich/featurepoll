import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/dashboard/empty-state";
import type { Post } from "@/lib/types";

interface ChangelogPageProps {
  searchParams: Promise<{ project?: string }>;
}

export default async function ChangelogPage({ searchParams }: ChangelogPageProps) {
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
        description="Create your first project to start tracking shipped features."
      />
    );
  }

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("project_id", projectId)
    .eq("status", "shipped")
    .order("created_at", { ascending: false });

  const typedPosts = (posts ?? []) as Post[];

  return (
    <div>
      <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
        Changelog
      </h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Features that have been shipped
      </p>

      <div className="mt-6 space-y-4">
        {typedPosts.length === 0 ? (
          <EmptyState
            title="No shipped features yet"
            description="Move feature requests to 'Shipped' status and they'll appear here."
          />
        ) : (
          typedPosts.map((post) => (
            <div
              key={post.id}
              className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {post.title}
                  </h3>
                  {post.description && (
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                      {post.description}
                    </p>
                  )}
                </div>
                <time className="flex-shrink-0 text-xs text-neutral-500 dark:text-neutral-400">
                  {new Date(post.created_at).toLocaleDateString()}
                </time>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
