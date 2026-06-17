"use client";

import { useEffect, useRef, useState } from "react";
import type { Post, PostStatus } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PublicBoardProps {
  projectName: string;
  projectId: string;
  publishableKey: string;
  initialPosts: Post[];
}

type FilterValue = "not_done" | "all" | PostStatus;

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  PostStatus,
  { label: string; emoji: string; badgeClass: string }
> = {
  open: {
    label: "Pending",
    emoji: "👀",
    badgeClass: "bg-neutral-100 text-neutral-600",
  },
  planned: {
    label: "Approved",
    emoji: "👍",
    badgeClass: "bg-blue-50 text-blue-600",
  },
  in_progress: {
    label: "In Progress",
    emoji: "🛠️",
    badgeClass: "bg-amber-50 text-amber-700",
  },
  shipped: {
    label: "Done",
    emoji: "✅",
    badgeClass: "bg-green-50 text-green-700",
  },
  declined: {
    label: "Rejected",
    emoji: "❌",
    badgeClass: "bg-red-50 text-red-600",
  },
};

const ROADMAP_COLUMNS: PostStatus[] = [
  "open",
  "planned",
  "in_progress",
  "shipped",
  "declined",
];

const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: "not_done", label: "Not done" },
  { value: "all", label: "All" },
  { value: "open", label: "Pending" },
  { value: "planned", label: "Approved" },
  { value: "in_progress", label: "In Progress" },
  { value: "shipped", label: "Done" },
  { value: "declined", label: "Rejected" },
];

// ─── LocalStorage helpers ─────────────────────────────────────────────────────

function getOrCreateDeviceId(projectId: string): string {
  const key = `featurepoll_device_id_${projectId}`;
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function getVotedPostIds(projectId: string): Set<string> {
  const key = `featurepoll_votes_${projectId}`;
  try {
    const raw = localStorage.getItem(key);
    const arr: string[] = raw ? JSON.parse(raw) : [];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function saveVotedPostIds(projectId: string, ids: Set<string>) {
  const key = `featurepoll_votes_${projectId}`;
  localStorage.setItem(key, JSON.stringify(Array.from(ids)));
}

// ─── API helpers ──────────────────────────────────────────────────────────────

function edgeFnUrl(path: string): string {
  const base =
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "") + "/functions/v1";
  return `${base}/${path}`;
}

async function apiFetch(
  path: string,
  method: string,
  publishableKey: string,
  body?: object
) {
  const res = await fetch(edgeFnUrl(path), {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-publishable-key": publishableKey,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PostStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.open;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.badgeClass}`}
    >
      <span>{cfg.emoji}</span>
      <span>{cfg.label}</span>
    </span>
  );
}

function VoteButton({
  count,
  voted,
  onClick,
  loading,
}: {
  count: number;
  voted: boolean;
  onClick: () => void;
  loading: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      aria-label={voted ? "Remove vote" : "Vote"}
      className={`flex min-w-[48px] flex-col items-center rounded-lg border px-2.5 py-1.5 transition-all duration-200 active:scale-95 ${
        voted
          ? "border-accent bg-accent-tint text-accent scale-110 shadow-sm"
          : "border-border bg-white text-text-muted hover:border-accent hover:text-accent hover:scale-105"
      } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 15l7-7 7 7"
        />
      </svg>
      <span className="text-sm font-semibold leading-none mt-0.5">{count}</span>
    </button>
  );
}

function PostRow({
  post,
  voted,
  onVote,
  votingId,
}: {
  post: Post;
  voted: boolean;
  onVote: (postId: string) => void;
  votingId: string | null;
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-white px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      {/* Text area */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text">{post.title}</p>
        {post.description && (
          <p className="mt-0.5 truncate text-xs text-text-muted">
            {post.description}
          </p>
        )}
      </div>

      {/* Status badge */}
      <StatusBadge status={post.status} />

      {/* Vote button */}
      <VoteButton
        count={post.vote_count ?? 0}
        voted={voted}
        onClick={() => onVote(post.id)}
        loading={votingId === post.id}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PublicBoard({
  projectName,
  projectId,
  publishableKey,
  initialPosts,
}: PublicBoardProps) {
  const [tab, setTab] = useState<"requests" | "roadmap">("requests");
  const [filter, setFilter] = useState<FilterValue>("not_done");
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [votingId, setVotingId] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);

  // Init device ID + vote state from localStorage (client-only)
  useEffect(() => {
    const id = getOrCreateDeviceId(projectId);
    setDeviceId(id);

    // Merge server-side voted flags with localStorage
    const stored = getVotedPostIds(projectId);
    const serverVoted = new Set(
      initialPosts
        .filter((p) => (p as Post & { voted_by_device?: boolean }).voted_by_device)
        .map((p) => p.id)
    );
    const merged = new Set([...stored, ...serverVoted]);
    setVotedIds(merged);
    saveVotedPostIds(projectId, merged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // ── Filtering ──────────────────────────────────────────────────────────────

  const filteredPosts = posts.filter((p) => {
    if (filter === "all") return true;
    if (filter === "not_done") return p.status !== "shipped" && p.status !== "declined";
    return p.status === filter;
  });

  // ── Vote toggle ────────────────────────────────────────────────────────────

  async function handleVote(postId: string) {
    if (!deviceId || votingId) return;

    const alreadyVoted = votedIds.has(postId);
    setVotingId(postId);

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              vote_count: (p.vote_count ?? 0) + (alreadyVoted ? -1 : 1),
            }
          : p
      )
    );
    const newVotedIds = new Set(votedIds);
    if (alreadyVoted) {
      newVotedIds.delete(postId);
    } else {
      newVotedIds.add(postId);
    }
    setVotedIds(newVotedIds);
    saveVotedPostIds(projectId, newVotedIds);

    try {
      if (alreadyVoted) {
        await apiFetch("votes", "DELETE", publishableKey, {
          post_id: postId,
          device_id: deviceId,
        });
      } else {
        await apiFetch("votes", "POST", publishableKey, {
          post_id: postId,
          device_id: deviceId,
        });
      }
    } catch {
      // Revert optimistic update on failure
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                vote_count: (p.vote_count ?? 0) + (alreadyVoted ? 1 : -1),
              }
            : p
        )
      );
      const revertedIds = new Set(votedIds);
      setVotedIds(revertedIds);
      saveVotedPostIds(projectId, revertedIds);
    } finally {
      setVotingId(null);
    }
  }

  // ── Submit post ────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !deviceId || submitting) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const data = await apiFetch("posts", "POST", publishableKey, {
        title: title.trim(),
        description: description.trim() || undefined,
        device_id: deviceId,
      });

      const newPost: Post = {
        ...data.post,
        voted_by_device: false,
      };

      setPosts((prev) => [newPost, ...prev]);
      setTitle("");
      setDescription("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    } catch {
      setSubmitError("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Roadmap view ───────────────────────────────────────────────────────────

  function groupByStatus(arr: Post[]): Record<PostStatus, Post[]> {
    return ROADMAP_COLUMNS.reduce(
      (acc, status) => {
        acc[status] = arr.filter((p) => p.status === status);
        return acc;
      },
      {} as Record<PostStatus, Post[]>
    );
  }

  const grouped = groupByStatus(posts);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-page">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-10 border-b border-border bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-page items-center justify-between px-4 py-3 sm:px-6">
          {/* Left: project name + tabs */}
          <div className="flex items-center gap-6 min-w-0">
            <span className="shrink-0 text-base font-bold text-text truncate max-w-[160px] sm:max-w-xs">
              {projectName}
            </span>
            <nav className="flex items-center gap-1 border-b border-transparent" aria-label="Board tabs">
              <button
                onClick={() => setTab("requests")}
                className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${
                  tab === "requests"
                    ? "border-accent text-accent"
                    : "border-transparent text-text-muted hover:text-text hover:border-neutral-300"
                }`}
              >
                Feature Requests
              </button>
              <button
                onClick={() => setTab("roadmap")}
                className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${
                  tab === "roadmap"
                    ? "border-accent text-accent"
                    : "border-transparent text-text-muted hover:text-text hover:border-neutral-300"
                }`}
              >
                Roadmap
              </button>
            </nav>
          </div>

          {/* Right: decorative settings icon */}
          <button
            aria-label="Settings"
            className="rounded-md p-1.5 text-text-faint hover:text-text-muted transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <main className="mx-auto max-w-page px-4 py-8 sm:px-6">
        {tab === "requests" ? (
          /* ── Feature Requests tab ── */
          <div className="flex flex-col gap-8 md:flex-row">
            {/* Left col: Submit form (1/3) */}
            <aside className="w-full md:w-1/3 md:shrink-0">
              <div className="rounded-card border border-border bg-white p-5 shadow-sm">
                <h2 className="mb-4 text-sm font-bold text-text">
                  Suggest a feature
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  {/* Title */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="post-title"
                      className="block text-xs font-medium text-text"
                    >
                      Title
                    </label>
                    <input
                      ref={titleRef}
                      id="post-title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="My awesome feature request"
                      maxLength={160}
                      required
                      className="w-full rounded-md border border-border bg-page px-3 py-2 text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="post-description"
                      className="block text-xs font-medium text-text"
                    >
                      Description
                    </label>
                    <textarea
                      id="post-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Input description here"
                      rows={4}
                      maxLength={1000}
                      className="w-full resize-none rounded-md border border-border bg-page px-3 py-2 text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  {/* Error message */}
                  {submitError && (
                    <p className="text-xs text-red-500">{submitError}</p>
                  )}

                  {/* Success message */}
                  {submitted && (
                    <p className="text-xs text-success font-medium animate-fade-in-up">
                      ✓ Request submitted!
                    </p>
                  )}

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={!title.trim() || submitting}
                    className={`w-full rounded-btn py-2 text-sm font-medium transition-colors ${
                      title.trim() && !submitting
                        ? "bg-accent text-white hover:bg-accent/90"
                        : "bg-accent/30 text-accent/60 cursor-not-allowed"
                    }`}
                  >
                    {submitting ? "Submitting…" : "Submit"}
                  </button>
                </form>

                {/* Anonymous session note */}
                <p className="mt-4 text-center text-xs text-text-faint">
                  Anonymous session
                </p>
              </div>
            </aside>

            {/* Right col: Feature requests list (2/3) */}
            <section className="flex-1 min-w-0">
              {/* Filter dropdown */}
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-text">
                  {filteredPosts.length === 1
                    ? "1 request"
                    : `${filteredPosts.length} requests`}
                </h2>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as FilterValue)}
                  aria-label="Filter posts"
                  className="rounded-md border border-border bg-white px-3 py-1.5 text-sm text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {FILTER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Posts list */}
              <div className="space-y-2">
                {filteredPosts.length === 0 ? (
                  <div className="rounded-card border border-border bg-white px-4 py-12 text-center">
                    <p className="text-sm text-text-faint">No requests yet.</p>
                    <p className="mt-1 text-xs text-text-faint">
                      Be the first to suggest a feature!
                    </p>
                  </div>
                ) : (
                  filteredPosts.map((post) => (
                    <PostRow
                      key={post.id}
                      post={post}
                      voted={votedIds.has(post.id)}
                      onVote={handleVote}
                      votingId={votingId}
                    />
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="mt-6 flex justify-end">
                <a
                  href="/"
                  className="text-xs text-text-faint hover:text-text-muted transition-colors"
                >
                  Powered by FeaturePoll
                </a>
              </div>
            </section>
          </div>
        ) : (
          /* ── Roadmap tab ── */
          <div>
            <h2 className="mb-4 text-sm font-bold text-text">Roadmap</h2>
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4" style={{ minWidth: "720px" }}>
                {ROADMAP_COLUMNS.map((status) => {
                  const cfg = STATUS_CONFIG[status];
                  const colPosts = grouped[status];
                  return (
                    <div
                      key={status}
                      className="flex min-w-[200px] flex-1 flex-col rounded-card border border-border bg-white"
                    >
                      {/* Column header */}
                      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.badgeClass}`}
                        >
                          <span>{cfg.emoji}</span>
                          <span>{cfg.label}</span>
                        </span>
                        <span className="text-xs text-text-faint">
                          {colPosts.length}
                        </span>
                      </div>

                      {/* Cards */}
                      <div className="flex-1 space-y-2 p-3">
                        {colPosts.length === 0 ? (
                          <p className="py-6 text-center text-xs text-text-faint">
                            No items
                          </p>
                        ) : (
                          colPosts.map((post) => (
                            <div
                              key={post.id}
                              className="rounded-lg border border-border bg-page p-3"
                            >
                              <div className="flex items-start gap-2">
                                {/* Vote count badge */}
                                <div className="flex shrink-0 flex-col items-center rounded-md border border-border bg-white px-2 py-1">
                                  <svg
                                    className="h-3 w-3 text-text-faint"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M5 15l7-7 7 7"
                                    />
                                  </svg>
                                  <span className="text-xs font-semibold text-text">
                                    {post.vote_count ?? 0}
                                  </span>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-text leading-snug line-clamp-2">
                                    {post.title}
                                  </p>
                                  {post.description && (
                                    <p className="mt-0.5 text-xs text-text-muted line-clamp-1">
                                      {post.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end">
              <a
                href="/"
                className="text-xs text-text-faint hover:text-text-muted transition-colors"
              >
                Powered by FeaturePoll
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
