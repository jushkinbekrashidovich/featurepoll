"use client";

import { useState } from "react";
import { updateThemeColor } from "@/app/dashboard/actions/settings";

interface ColorPickerProps {
  projectId: string;
  currentColor: string;
}

export function ColorPicker({ projectId, currentColor }: ColorPickerProps) {
  const [color, setColor] = useState(currentColor);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      await updateThemeColor(projectId, color);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save color");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-end gap-3">
      <div>
        <label
          htmlFor="theme-color"
          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          Accent Color
        </label>
        <div className="mt-1 flex items-center gap-2">
          <input
            id="theme-color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-10 cursor-pointer rounded border border-neutral-200 dark:border-neutral-700"
          />
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-28 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          />
        </div>
      </div>
      <button
        onClick={handleSave}
        disabled={saving || color === currentColor}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-50"
      >
        {saving ? "Saving..." : saved ? "Saved!" : "Save"}
      </button>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
