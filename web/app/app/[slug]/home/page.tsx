import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/types";

interface HomePageProps {
  params: Promise<{ slug: string }>;
}

const statusColumns = [
  { key: "open", label: "Pending", color: "bg-neutral-100 text-neutral-600" },
  { key: "planned", label: "Approved", color: "bg-blue-50 text-blue-600" },
  { key: "in_progress", label: "In Progress", color: "bg-amber-50 text-amber-600" },
  { key: "shipped", label: "Done", color: "bg-green-50 text-green-600" },
] as const;

export default async function ProjectHomePage({ params }: HomePageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("project_id", slug)
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
      {/* Header with title, sort, and create */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-text">Your Board</h1>
          <p className="mt-1 text-sm text-text-muted">
            Feature requests organized by status
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent">
            <option>Sort by Votes</option>
            <option>Sort by Newest</option>
            <option>Sort by Oldest</option>
          </select>
          <button className="rounded-btn bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors">
            Create
          </button>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statusColumns.map((col) => (
          <div key={col.key} className="flex flex-col rounded-lg border border-neutral-200 bg-white">
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
                    className="rounded-md border border-neutral-100 bg-white p-3 shadow-sm"
                  >
                    <h3 className="text-sm font-medium text-text">{post.title}</h3>
                    {post.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-text-muted">
                        {post.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs text-text-faint">
                        <svg
                          className="h-3 w-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 15l7-7 7 7"
                          />
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
