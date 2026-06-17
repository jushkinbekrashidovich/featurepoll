import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { PublicBoard } from "@/components/public/public-board";
import type { Post } from "@/lib/types";

interface PublicBoardPageProps {
  params: Promise<{ slug: string }>;
}

// Look up the project server-side using the service role key (no auth needed).
// The publishable key is safe to pass to the client — that's its purpose.
async function getProjectBySlug(slug: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, publishable_key, is_active")
    .eq("slug", slug)
    .single();

  return project;
}

async function getInitialPosts(
  publishableKey: string,
  projectId: string
): Promise<Post[]> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL + "/functions/v1";

  try {
    const res = await fetch(
      `${baseUrl}/board?page=1&page_size=100`,
      {
        headers: { "x-publishable-key": publishableKey },
        // Don't cache — fresh on every visit
        cache: "no-store",
      }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return (json.posts ?? []) as Post[];
  } catch {
    return [];
  }
}

export default async function PublicBoardPage({ params }: PublicBoardPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project || !project.is_active) {
    notFound();
  }

  const initialPosts = await getInitialPosts(
    project.publishable_key,
    project.id
  );

  return (
    <PublicBoard
      projectName={project.name}
      projectId={project.id}
      publishableKey={project.publishable_key}
      initialPosts={initialPosts}
    />
  );
}
