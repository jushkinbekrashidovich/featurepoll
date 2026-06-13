import { createClient } from "@/lib/supabase/server";
import { StatusColumn } from "@/components/dashboard/status-column";
import { EmptyState } from "@/components/dashboard/empty-state";
import type { Post, PostStatus } from "@/lib/types";

interface RoadmapPageProps {
  searchParams: Promise<{ project?: string }>;
}

const statusColumns: { status: PostStatus; label: string }[] = [
  { status: "open", label: "Open" },
  { status: "planned", label: "Planned" },
  { status: "in_progress", label: "In Progress" },
  { status: "shipped", label: "Shipped" },
  { status: "declined", label: "Declined" },
];

export default async function RoadmapPage({ searchParams }: RoadmapPageProps) {
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
        description="Create your first project to start managing your roadmap."
      />
    );
  }

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("project_id", projectId)
    .order("vote_count", { ascending: false });

  const typedPosts = (posts ?? []) as Post[];

  // Group posts by status
  const grouped = statusColumns.map((col) => ({
    ...col,
    posts: typedPosts.filter((p) => p.status === col.status),
  }));

  return (
    <div>
      <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
        Roadmap
      </h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Manage feature request statuses
      </p>

      <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
        {grouped.map((col) => (
          <StatusColumn
            key={col.status}
            status={col.status}
            label={col.label}
            posts={col.posts}
          />
        ))}
      </div>
    </div>
  );
}
