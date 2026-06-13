"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";

interface ProjectSwitcherProps {
  projects: { id: string; name: string }[];
  onCreateProject?: () => void;
}

export function ProjectSwitcher({ projects, onCreateProject }: ProjectSwitcherProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentProjectId = searchParams.get("project") || projects[0]?.id || "";

  function handleProjectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;

    if (value === "__create__") {
      onCreateProject?.();
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("project", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div>
      <label
        htmlFor="project-switcher"
        className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400"
      >
        Project
      </label>
      <select
        id="project-switcher"
        value={currentProjectId}
        onChange={handleProjectChange}
        className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-900 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
      >
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
        <option value="__create__">+ Create project</option>
      </select>
    </div>
  );
}
