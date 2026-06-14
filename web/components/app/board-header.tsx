"use client";

import { useState } from "react";
import { CreatePostModal } from "./create-post-modal";

interface BoardHeaderProps {
  projectId: string;
}

export function BoardHeader({ projectId }: BoardHeaderProps) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <>
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
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-btn bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
          >
            Create
          </button>
        </div>
      </div>

      <CreatePostModal
        projectId={projectId}
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </>
  );
}
