import type { Post } from "@/lib/types";

interface PostCardProps {
  post: Post;
  children?: React.ReactNode;
}

export function PostCard({ post, children }: PostCardProps) {
  const truncatedDescription =
    post.description && post.description.length > 120
      ? post.description.slice(0, 120) + "…"
      : post.description;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {post.title}
          </h4>
          {truncatedDescription && (
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              {truncatedDescription}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 rounded-md bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">
          ▲ {post.vote_count}
        </div>
      </div>

      {/* Context metadata */}
      {(post.screen_context || post.os || post.app_version) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {post.screen_context && (
            <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
              📍 {post.screen_context}
            </span>
          )}
          {post.os && (
            <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
              {post.os}
            </span>
          )}
          {post.app_version && (
            <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
              v{post.app_version}
            </span>
          )}
        </div>
      )}

      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
