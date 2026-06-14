"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { PostCardMenu } from "./post-card-menu";
import { updatePostStatus } from "@/app/app/actions/posts";
import type { Post, PostStatus } from "@/lib/types";

interface KanbanBoardProps {
  initialPosts: Post[];
}

const statusColumns: { key: PostStatus; label: string; color: string }[] = [
  { key: "open", label: "Pending", color: "bg-neutral-100 text-neutral-600" },
  { key: "planned", label: "Approved", color: "bg-blue-50 text-blue-600" },
  { key: "in_progress", label: "In Progress", color: "bg-amber-50 text-amber-600" },
  { key: "shipped", label: "Done", color: "bg-green-50 text-green-600" },
  { key: "declined", label: "Rejected", color: "bg-red-50 text-red-600" },
];

function groupByStatus(posts: Post[]): Record<PostStatus, Post[]> {
  const grouped: Record<PostStatus, Post[]> = {
    open: [],
    planned: [],
    in_progress: [],
    shipped: [],
    declined: [],
  };
  for (const post of posts) {
    const status = (post.status || "open") as PostStatus;
    if (grouped[status]) {
      grouped[status].push(post);
    } else {
      grouped.open.push(post);
    }
  }
  return grouped;
}

export function KanbanBoard({ initialPosts }: KanbanBoardProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);

  const grouped = groupByStatus(posts);

  async function handleDragEnd(result: DropResult) {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as PostStatus;
    const postId = draggableId;

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, status: newStatus } : p))
    );

    // Persist to server
    try {
      await updatePostStatus(postId, newStatus);
    } catch {
      // Revert on error
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, status: source.droppableId as PostStatus } : p))
      );
    }
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "calc(100vh - 200px)" }}>
        {statusColumns.map((col) => (
          <Droppable key={col.key} droppableId={col.key}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`flex min-w-[280px] flex-1 flex-col rounded-lg border bg-white transition-colors ${
                  snapshot.isDraggingOver ? "border-accent bg-accent-tint/30" : "border-neutral-200"
                }`}
              >
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
                  {grouped[col.key].length === 0 && !snapshot.isDraggingOver && (
                    <p className="py-6 text-center text-xs text-text-faint">No items</p>
                  )}
                  {grouped[col.key].map((post, index) => (
                    <Draggable key={post.id} draggableId={post.id} index={index}>
                      {(dragProvided, dragSnapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          className={`rounded-lg border bg-white p-3 transition-shadow ${
                            dragSnapshot.isDragging
                              ? "border-accent shadow-lg ring-2 ring-accent/20"
                              : "border-neutral-200 shadow-sm"
                          }`}
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
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
