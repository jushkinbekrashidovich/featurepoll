"use client";

import { useState } from "react";
import { createProject } from "@/app/dashboard/actions/projects";
import { CopyButton } from "./copy-button";

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateProjectModal({ open, onClose }: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdProject, setCreatedProject] = useState<{
    name: string;
    publishable_key: string;
  } | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const project = await createProject(name.trim());
      setCreatedProject({ name: project.name, publishable_key: project.publishable_key });
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setName("");
    setError(null);
    setCreatedProject(null);
    onClose();
  }

  const snippet = createdProject
    ? `FeaturePoll.init("${createdProject.publishable_key}");`
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative w-full max-w-md rounded-lg border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
        {createdProject ? (
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Project Created!
            </h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Your project <strong>{createdProject.name}</strong> is ready. Here&apos;s your publishable key:
            </p>

            <div className="mt-4 rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800">
              <div className="flex items-center justify-between gap-2">
                <code className="break-all text-xs text-neutral-800 dark:text-neutral-200">
                  {createdProject.publishable_key}
                </code>
                <CopyButton text={createdProject.publishable_key} />
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                Add to your Flutter app:
              </p>
              <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-800">
                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs text-neutral-800 dark:text-neutral-200">
                    {snippet}
                  </code>
                  <CopyButton text={snippet} />
                </div>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="mt-6 w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Create Project
            </h2>
            <form onSubmit={handleSubmit} className="mt-4">
              <label
                htmlFor="project-name"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                Project Name
              </label>
              <input
                id="project-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My App"
                className="mt-1 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                autoFocus
              />

              {error && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
              )}

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 rounded-md border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="flex-1 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
