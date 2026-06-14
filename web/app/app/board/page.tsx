import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/types";

interface BoardPageProps {
  searchParams: Promise<{ project?: string }>;
}

const statusColumns = [
  { key: "open", label: "Pending", color: "bg-neutral-100 text-neutral-600" },
  { key: "planned", label: "Approved", color: "bg-blue-50 text-blue-600" },
  { key: "in_progress", label: "In Progress", color: "bg-amber-50 text-amber-600" },
  { key: "shipped", label: "Done", color: "bg-green-50 text-green-600" },
] as const;

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
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-text-muted">No projects yet. Create one to get started.</p>
      </div>
    );
  }

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("project_id", projectId)
    .order("vote_count", { ascending: false });

  const typedPosts = (posts ?? []) as Post[];

  // Group posts by status
  const grouped: Record<string, Post[]> = {
    open: [],
    planned: [],
    in_progress: [],
    shipped: [],
  };

  for (const post of typedPosts) {
    const status = post.status || "open";
    if (grouped[status]) {
      grouped[status].push(post);
    } else {
      grouped.open.push(post);
    }
  }

  return (
    <div>
      <h1 className="text-lg font-bold text-text">Board</h1>
      <p className="mt-1 text-sm text-text-muted">
        Feature requests organized by status
      </p>

      {/* Kanban columns */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statusColumns.map((col) => (
          <div key={col.key} className="flex flex-col rounded-lg border border-neutral-200 bg-white">
            {/* Column header */}
            <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-3">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${col.color}`}>
                {col.label}
              </span>
              <span className="text-xs text-text-faint">
                {grouped[col.key].length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-2 p-3">
              {grouped[col.key].length === 0 ? (
                <p className="py-6 text-center text-xs text-text-faint">
                  No items
                </p>
              ) : (
                grouped[col.key].map((post) => (
                  <div
                    key={post.id}
                    className="rounded-md border border-neutral-100 bg-white p-3 shadow-sm"
                  >
                    <h3 className="text-sm font-medium text-text">{post.title}</h3>
                    {post.description && (
                      <p className="mt-1 text-xs text-text-muted line-clamp-2">
                        {post.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs text-text-faint">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                        {post.vote_count ?? 0}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
