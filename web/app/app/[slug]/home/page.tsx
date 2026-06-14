import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BoardHeader } from "@/components/app/board-header";
import { PostCardMenu } from "@/components/app/post-card-menu";
import type { Post } from "@/lib/types";

interface HomePageProps {
  params: Promise<{ slug: string }>;
}

const statusColumns = [
  { key: "open", label: "Pending", color: "bg-neutral-100 text-neutral-600" },
  { key: "planned", label: "Approved", color: "bg-blue-50 text-blue-600" },
  { key: "in_progress", label: "In Progress", color: "bg-amber-50 text-amber-600" },
  { key: "shipped", label: "Done", color: "bg-green-50 text-green-600" },
  { key: "declined", label: "Rejected", color: "bg-red-50 text-red-600" },
] as const;

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

  // Group posts by status
  const grouped: Record<string, Post[]> = {
    open: [],
    planned: [],
    in_progress: [],
    shipped: [],
    declined: [],
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
      <BoardHeader projectId={projectId} />

      {/* Kanban columns — horizontal scroll, full height */}
      <div className="mt-6 flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "calc(100vh - 200px)" }}>
        {statusColumns.map((col) => (
          <div key={col.key} className="flex min-w-[280px] flex-1 flex-col rounded-lg border border-neutral-200 bg-white">
            {/* Column header */}
            <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-3">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${col.color}`}
              >
                {col.label}
              </span>
              <span className="text-xs text-text-faint">
                {grouped[col.key].length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-2 p-3">
              {grouped[col.key].length === 0 ? (
                <p className="py-6 text-center text-xs text-text-faint">No items</p>
              ) : (
                grouped[col.key].map((post) => (
                  <div
                    key={post.id}
                    className="rounded-lg border border-neutral-200 bg-white p-3 shadow-sm"
                  >
                    {/* Top row: vote + title + menu */}
                    <div className="flex items-start gap-3">
                      {/* Vote button */}
                      <div className="flex flex-col items-center rounded-md border border-neutral-200 px-2.5 py-1.5 text-center">
                        <svg className="h-3 w-3 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                        <span className="text-sm font-semibold text-text">{post.vote_count ?? 0}</span>
                      </div>

                      {/* Title */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-text leading-tight">{post.title}</h3>
                      </div>

                      {/* Three dots menu */}
                      <PostCardMenu postId={post.id} currentStatus={post.status} />
                    </div>

                    {/* Description below */}
                    {post.description && (
                      <p className="mt-2 text-xs text-text-muted line-clamp-2">
                        {post.description}
                      </p>
                    )}
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
