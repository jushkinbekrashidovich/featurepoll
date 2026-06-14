import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SharePageClient } from "@/components/app/share-page-client";

export default async function SharePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Try slug first, fall back to id
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
    <SharePageClient
      projectSlug={project.slug}
      publishableKey={project.publishable_key}
    />
  );
}
