import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AppTopNav } from "@/components/app/top-nav";
import { AppSidebar } from "@/components/app/sidebar";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .order("created_at", { ascending: true });

  // Try slug first, fall back to id for backwards compatibility
  let { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!project) {
    const { data: projectById } = await supabase
      .from("projects")
      .select("*")
      .eq("id", slug)
      .single();
    project = projectById;
  }

  if (!project) redirect("/app");

  return (
    <div className="flex h-screen flex-col bg-[#F0F7FA]">
      <AppTopNav
        projects={projects ?? []}
        currentProjectId={slug}
        userEmail={user.email ?? ""}
        userAvatar={user.user_metadata?.avatar_url}
      />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar projectSlug={slug} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
