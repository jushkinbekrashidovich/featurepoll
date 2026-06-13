import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ColorPicker } from "@/components/dashboard/color-picker";
import { KeyManagement } from "./key-management";
import type { Project } from "@/lib/types";

interface SettingsPageProps {
  searchParams: Promise<{ project?: string }>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  // Get active project
  let projectId = params.project;
  if (!projectId) {
    const { data: projects } = await supabase
      .from("projects")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1);
    projectId = projects?.[0]?.id;
  }

  if (!projectId) {
    return (
      <EmptyState
        title="No projects yet"
        description="Create your first project to access settings."
      />
    );
  }

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (!project) {
    return (
      <EmptyState
        title="Project not found"
        description="The selected project could not be loaded."
      />
    );
  }

  const typedProject = project as Project;
  const accentColor = typedProject.theme_json?.accent_color ?? "#6366f1";

  return (
    <div>
      <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
        Settings
      </h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Manage your project configuration
      </p>

      <div className="mt-8 space-y-8">
        {/* Theme Section */}
        <section className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Theme
          </h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Customize the widget appearance for your users
          </p>
          <div className="mt-4">
            <ColorPicker projectId={typedProject.id} currentColor={accentColor} />
          </div>
        </section>

        {/* Key Management Section */}
        <section className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Key Management
          </h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Manage your publishable API key
          </p>
          <div className="mt-4">
            <KeyManagement
              projectId={typedProject.id}
              publishableKey={typedProject.publishable_key}
              isActive={typedProject.is_active}
            />
          </div>
        </section>

        {/* Billing Section */}
        <section className="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Billing
          </h2>
          <div className="mt-4 flex items-center justify-center rounded-md border border-dashed border-neutral-300 py-8 dark:border-neutral-600">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Coming soon — billing management will be available here.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
