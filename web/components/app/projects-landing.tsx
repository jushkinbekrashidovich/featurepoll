"use client";

import { useState, useEffect } from "react";
import { createProject } from "@/app/app/actions/projects";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import Link from "next/link";

interface ProjectsLandingProps {
  projects: { id: string; name: string; slug: string; created_at: string }[];
}

const PLATFORMS = [
  { id: "flutter", label: "Flutter" },
  { id: "web", label: "Web" },
  { id: "ios", label: "iOS/Apple" },
  { id: "android", label: "Android" },
  { id: "others", label: "Others" },
];

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ProjectsLanding({ projects }: ProjectsLandingProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slugManuallyEdited) {
      setSlug(generateSlug(name));
    }
  }, [name, slugManuallyEdited]);

  function handleSlugChange(value: string) {
    setSlugManuallyEdited(true);
    setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
  }

  function togglePlatform(platformId: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    setCreating(true);
    setError("");

    try {
      const platform = selectedPlatforms.length > 0 ? selectedPlatforms.join(",") : undefined;
      const project = await createProject(name.trim(), slug.trim(), platform);
      router.push(`/app/${project.slug}/home`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
      setCreating(false);
    }
  }

  function getProjectColor(projectName: string): string {
    const colors = [
      "bg-blue-500",
      "bg-emerald-500",
      "bg-violet-500",
      "bg-amber-500",
      "bg-rose-500",
      "bg-cyan-500",
      "bg-indigo-500",
      "bg-pink-500",
    ];
    let hash = 0;
    for (let i = 0; i < projectName.length; i++) {
      hash = projectName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  return (
    <div className="mx-auto max-w-4xl py-8">
      <h1 className="text-xl font-bold text-text">Projects</h1>
      <p className="mt-1 text-sm text-text-muted">
        Each project has their own public voting board on FeaturePoll
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Existing project cards */}
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/app/${project.slug}/home`}
            className="group flex flex-col items-start rounded-card border border-neutral-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ${getProjectColor(project.name)}`}
            >
              {project.name.charAt(0).toUpperCase()}
            </div>
            <h3 className="mt-3 text-sm font-semibold text-text">{project.name}</h3>
            <span className="mt-2 text-xs font-medium text-accent group-hover:underline">
              View Dashboard →
            </span>
          </Link>
        ))}

        {/* Create Project card */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="flex h-full min-h-[140px] flex-col items-center justify-center rounded-card border-2 border-dashed border-neutral-300 bg-white transition-colors hover:border-accent hover:bg-accent-tint"
          >
            <div className="flex flex-col items-center gap-2 text-text-muted">
              <Plus className="h-8 w-8" />
              <span className="text-sm font-medium">Create Project</span>
            </div>
          </button>
        ) : (
          <form
            onSubmit={handleCreate}
            className="col-span-1 flex flex-col rounded-card border border-neutral-200 bg-white p-5 shadow-sm sm:col-span-2"
          >
            <h2 className="text-sm font-semibold text-text">New Project</h2>
            <p className="mt-1 text-xs text-text-muted">
              Give your project a name. You can change it later.
            </p>

            {/* Project Name */}
            <label className="mt-4 text-xs font-medium text-text-muted">Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My App"
              autoFocus
              className="mt-1 w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />

            {/* Project Slug */}
            <label className="mt-3 text-xs font-medium text-text-muted">Project Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="my-app"
              className="mt-1 w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-text placeholder:text-text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent font-mono"
            />
            {slug && (
              <p className="mt-1.5 text-xs text-text-faint">
                Preview: <span className="font-mono text-accent">https://{slug}.featurepoll.dev/board</span>
              </p>
            )}

            {/* Platform Checkboxes */}
            <label className="mt-4 text-xs font-medium text-text-muted">Platforms</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PLATFORMS.map((platform) => (
                <label
                  key={platform.id}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedPlatforms.includes(platform.id)
                      ? "border-accent bg-accent-tint text-accent-text"
                      : "border-neutral-200 bg-white text-text-muted hover:border-neutral-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.includes(platform.id)}
                    onChange={() => togglePlatform(platform.id)}
                    className="sr-only"
                  />
                  {platform.label}
                </label>
              ))}
            </div>

            {error && (
              <p className="mt-3 text-xs text-red-600">{error}</p>
            )}

            <div className="mt-4 flex items-center gap-3">
              <button
                type="submit"
                disabled={creating || !name.trim() || !slug.trim()}
                className="rounded-btn bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50 transition-colors"
              >
                {creating ? "Creating..." : "Create"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setName("");
                  setSlug("");
                  setSlugManuallyEdited(false);
                  setSelectedPlatforms([]);
                  setError("");
                }}
                className="text-sm text-text-muted hover:text-text"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
