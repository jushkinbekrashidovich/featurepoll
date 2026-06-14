import { createClient } from "@/lib/supabase/server";
import { SimpleTopNav } from "@/components/app/simple-top-nav";
import { ProjectsLanding } from "@/components/app/projects-landing";

export default async function ProjectsListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, slug, created_at")
    .order("created_at", { ascending: true });

  return (
    <div className="flex h-screen flex-col bg-[#F0F7FA]">
      <SimpleTopNav
        userEmail={user?.email ?? ""}
        userAvatar={user?.user_metadata?.avatar_url}
      />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <ProjectsLanding projects={projects ?? []} />
      </main>
    </div>
  );
}
