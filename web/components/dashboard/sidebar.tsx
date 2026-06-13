"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

interface SidebarProps {
  projects: { id: string; name: string }[];
}

const navLinks = [
  { href: "/dashboard/board", label: "Board" },
  { href: "/dashboard/roadmap", label: "Roadmap" },
  { href: "/dashboard/changelog", label: "Changelog" },
  { href: "/dashboard/settings", label: "Settings" },
];

function SidebarContent({ projects }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentProjectId = searchParams.get("project") || projects[0]?.id || "";

  function handleProjectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;

    if (value === "__create__") {
      // CreateProjectModal will be connected in task 5.3
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("project", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <aside className="flex h-full w-[250px] flex-col border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      {/* Project Switcher */}
      <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
        <label htmlFor="project-switcher" className="mb-1 block text-xs font-medium text-neutral-500 dark:text-neutral-400">
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

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            const href = currentProjectId
              ? `${link.href}?project=${currentProjectId}`
              : link.href;

            return (
              <li key={link.href}>
                <Link
                  href={href}
                  className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent-light text-accent dark:bg-accent-dark dark:text-indigo-200"
                      : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

export function Sidebar({ projects }: SidebarProps) {
  return (
    <Suspense fallback={<SidebarSkeleton />}>
      <SidebarContent projects={projects} />
    </Suspense>
  );
}

function SidebarSkeleton() {
  return (
    <aside className="flex h-full w-[250px] flex-col border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
        <div className="h-4 w-12 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="mt-2 h-9 w-full animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-700" />
      </div>
      <div className="px-3 py-4">
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 w-full animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-700" />
          ))}
        </div>
      </div>
    </aside>
  );
}
