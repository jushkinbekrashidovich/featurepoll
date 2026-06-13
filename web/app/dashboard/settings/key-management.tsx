"use client";

import { useState } from "react";
import { CopyButton } from "@/components/dashboard/copy-button";
import { rotateKey, toggleProjectActive } from "@/app/dashboard/actions/settings";

interface KeyManagementProps {
  projectId: string;
  publishableKey: string;
  isActive: boolean;
}

export function KeyManagement({ projectId, publishableKey, isActive }: KeyManagementProps) {
  const [key, setKey] = useState(publishableKey);
  const [active, setActive] = useState(isActive);
  const [rotating, setRotating] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRotate() {
    setRotating(true);
    setError(null);

    try {
      const result = await rotateKey(projectId);
      setKey(result.publishable_key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rotate key");
    } finally {
      setRotating(false);
    }
  }

  async function handleToggle() {
    const newValue = !active;
    setToggling(true);
    setError(null);

    // Optimistic
    setActive(newValue);

    try {
      await toggleProjectActive(projectId, newValue);
    } catch (err) {
      setActive(!newValue); // Revert
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setToggling(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Current key display */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Publishable Key
        </label>
        <div className="mt-1 flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800">
          <code className="flex-1 break-all text-xs text-neutral-800 dark:text-neutral-200">
            {key}
          </code>
          <CopyButton text={key} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleRotate}
          disabled={rotating}
          className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
        >
          {rotating ? "Rotating..." : "Rotate Key"}
        </button>

        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 ${
            active
              ? "border border-red-200 bg-white text-red-600 hover:bg-red-50 dark:border-red-800 dark:bg-neutral-800 dark:text-red-400 dark:hover:bg-red-900/20"
              : "border border-green-200 bg-white text-green-600 hover:bg-green-50 dark:border-green-800 dark:bg-neutral-800 dark:text-green-400 dark:hover:bg-green-900/20"
          }`}
        >
          {active ? "Deactivate" : "Activate"}
        </button>

        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            active
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {active ? "Active" : "Inactive"}
        </span>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
