"use client";

import { useState, useRef, useEffect } from "react";
import { updatePostStatus, deletePost } from "@/app/app/actions/posts";

interface PostCardMenuProps {
  postId: string;
  currentStatus: string;
}

const statuses = [
  { key: "open", label: "Pending", emoji: "👀" },
  { key: "planned", label: "Approved", emoji: "👍" },
  { key: "in_progress", label: "In Progress", emoji: "🛠" },
  { key: "shipped", label: "Done", emoji: "✅" },
  { key: "declined", label: "Rejected", emoji: "❌" },
];

export function PostCardMenu({ postId, currentStatus }: PostCardMenuProps) {
  const [open, setOpen] = useState(false);
  const [showMoveTo, setShowMoveTo] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowMoveTo(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleMoveTo(status: string) {
    try {
      await updatePostStatus(postId, status as "open" | "planned" | "in_progress" | "shipped" | "declined");
    } catch {
      // Handle error silently for now
    }
    setOpen(false);
    setShowMoveTo(false);
  }

  async function handleDelete() {
    try {
      await deletePost(postId);
    } catch {
      // Handle error silently
    }
    setOpen(false);
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => { setOpen(!open); setShowMoveTo(false); }}
        className="shrink-0 rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-text transition-colors"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.5"/>
          <circle cx="12" cy="12" r="1.5"/>
          <circle cx="12" cy="19" r="1.5"/>
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
          {/* Move to — with submenu */}
          <div className="relative">
            <button
              onClick={() => setShowMoveTo(!showMoveTo)}
              className="flex w-full items-center justify-between px-3 py-2 text-sm text-text hover:bg-neutral-50"
            >
              <span className="flex items-center gap-2">
                <span className="text-neutral-400">›</span>
                Move to
              </span>
              <span className="text-neutral-400">›</span>
            </button>

            {showMoveTo && (
              <div className="absolute left-full top-0 ml-1 w-44 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
                {statuses.map((s) => (
                  <button
                    key={s.key}
                    disabled={s.key === currentStatus}
                    onClick={() => handleMoveTo(s.key)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors ${
                      s.key === currentStatus
                        ? "text-neutral-300 cursor-not-allowed"
                        : "text-text hover:bg-neutral-50"
                    }`}
                  >
                    <span>{s.emoji}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Delete */}
          <button
            onClick={handleDelete}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <span>🗑</span>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
