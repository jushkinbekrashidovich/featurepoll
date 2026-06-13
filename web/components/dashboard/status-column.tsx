import type { Post } from "@/lib/types";
import { PostCard } from "./post-card";
import { StatusDropdown } from "./status-dropdown";

interface StatusColumnProps {
  status: string;
  label: string;
  posts: Post[];
}

export function StatusColumn({ status, label, posts }: StatusColumnProps) {
  return (
    <div className="flex min-w-[280px] flex-col rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900/50">
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-700">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {label}
        </h3>
        <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
          {posts.length}
        </span>
      </div>
      <div className="flex-1 space-y-2 p-3">
        {posts.length === 0 ? (
          <p className="py-4 text-center text-xs text-neutral-400 dark:text-neutral-500">
            No posts
          </p>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post}>
              <StatusDropdown postId={post.id} currentStatus={post.status} />
            </PostCard>
          ))
        )}
      </div>
    </div>
  );
}
