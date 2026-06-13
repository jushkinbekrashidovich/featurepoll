"use client";

import { useState } from "react";
import { updatePostStatus } from "@/app/dashboard/actions/posts";
import type { PostStatus } from "@/lib/types";

interface StatusDropdownProps {
  postId: string;
  currentStatus: PostStatus;
}

const statusOptions: { value: PostStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "shipped", label: "Shipped" },
  { value: "declined", label: "Declined" },
];

export function StatusDropdown({ postId, currentStatus }: StatusDropdownProps) {
  const [status, setStatus] = useState<PostStatus>(currentStatus);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as PostStatus;
    const previousStatus = status;

    // Optimistic update
    setStatus(newStatus);
    setError(null);

    try {
      await updatePostStatus(postId, newStatus);
    } catch (err) {
      // Revert on error
      setStatus(previousStatus);
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  return (
    <div>
      <select
        value={status}
        onChange={handleChange}
        className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-700 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
      >
        {statusOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
