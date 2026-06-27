import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

export async function Hero() {
  let isSignedIn = false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isSignedIn = !!user;
  } catch {
    // Auth check failed — treat as not signed in
  }

  return (
    <section className="bg-page pt-20 pb-24 md:pt-28 md:pb-32">
      <div className="mx-auto max-w-page px-6">
        <div className="flex flex-col items-center text-center">
          {/* Eyebrow */}
          <span className="animate-fade-in-up inline-block rounded-full bg-accent-tint px-4 py-1.5 text-[13px] font-semibold uppercase text-accent-text tracking-wide mb-8">
            Stop guessing what to build
          </span>

          {/* Headline */}
          <h1 className="animate-fade-in-up-delay-1 text-[40px] md:text-[52px] lg:text-[60px] font-bold leading-[1.1] tracking-[-1px] text-text mb-5 max-w-3xl">
            Build what your users <span className="bg-gradient-to-r from-accent to-orange-400 bg-clip-text text-transparent">actually</span> want
          </h1>

          {/* Subheadline */}
          <p className="animate-fade-in-up-delay-2 text-base md:text-lg leading-relaxed text-text-muted mb-10 max-w-xl">
            Collect feature requests and votes from inside your app, your
            website, and your community — all in one place. No sign-up for your
            users.
          </p>

          {/* CTA button — auth-aware */}
          {isSignedIn ? (
            <a
              href="/app"
              className="rounded-full bg-emerald-400 px-8 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors"
            >
              Go to App
            </a>
          ) : (
            <a
              href="/login"
              className="rounded-btn bg-accent px-8 py-3.5 text-sm font-semibold text-white hover:bg-accent/90 transition-colors"
            >
              Try it for free →
            </a>
          )}

          {!isSignedIn && (
            <p className="text-xs text-text-faint mt-3">
              Free plan · no card required
            </p>
          )}

          {/* iPhone frame with real app screenshot */}
          <div className="animate-fade-in-up-delay-3 mt-16">
            <div className="relative mx-auto w-[260px] md:w-[300px]">
              {/* Phone bezel */}
              <div className="rounded-[3rem] border-[10px] border-neutral-900 bg-neutral-900 shadow-2xl overflow-hidden">
                {/* Dynamic Island */}
                <div className="absolute top-[14px] left-1/2 -translate-x-1/2 z-10 h-[22px] w-[90px] rounded-full bg-black" />
                {/* Screenshot */}
                <Image
                  src="/app-screenshot.png"
                  alt="FeaturePoll in-app feature board showing feature requests with votes"
                  width={600}
                  height={1300}
                  className="w-full h-auto rounded-[2rem]"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
