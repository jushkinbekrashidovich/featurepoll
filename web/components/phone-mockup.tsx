import { Badge } from "@/components/ui/badge";

type PostStatus = "open" | "planned" | "shipped";

interface MockPost {
  id: number;
  title: string;
  votes: number;
  status: PostStatus;
}

const SAMPLE_POSTS: MockPost[] = [
  { id: 1, title: "Dark mode support", votes: 47, status: "shipped" },
  { id: 2, title: "Export to CSV", votes: 32, status: "planned" },
  { id: 3, title: "Slack integration", votes: 18, status: "open" },
  { id: 4, title: "Custom categories", votes: 12, status: "open" },
];

const STATUS_LABEL: Record<PostStatus, string> = {
  open: "Open",
  planned: "Planned",
  shipped: "Shipped",
};

export function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px] md:w-[320px]">
      {/* Phone frame — pure CSS */}
      <div className="rounded-[3rem] border-[12px] border-neutral-800 dark:border-neutral-600 bg-white dark:bg-neutral-900 shadow-2xl overflow-hidden">
        {/* Notch */}
        <div className="mx-auto mt-2 h-6 w-28 rounded-full bg-neutral-800 dark:bg-neutral-600" />

        {/* Screen content — board UI */}
        <div className="px-4 py-3 space-y-3">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            Feature Requests
          </h3>

          {SAMPLE_POSTS.map((post) => (
            <div
              key={post.id}
              className="flex items-center gap-3 rounded-lg border border-neutral-200 dark:border-neutral-700 p-2"
            >
              {/* Vote button */}
              <div className="flex flex-col items-center rounded bg-accent-light dark:bg-accent-dark/20 px-2 py-1 text-xs font-bold text-accent">
                <span>▲</span>
                <span>{post.votes}</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200 truncate">
                  {post.title}
                </p>
                <Badge variant={post.status}>{STATUS_LABEL[post.status]}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
