"use client";

import { useState, type FormEvent } from "react";
import { Globe } from "lucide-react";
import { supabase } from "@/lib/supabase";

type FormState = "idle" | "submitting" | "success" | "error";

export function Hero() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setState("error");
      return;
    }
    setState("submitting");
    const { error } = await supabase
      .from("waitlist")
      .insert({ email: email.trim(), source: "hero" });
    if (error) {
      setState("error");
    } else {
      setState("success");
    }
  }

  return (
    <section className="bg-page pt-20 pb-24 md:pt-28 md:pb-32">
      <div className="mx-auto max-w-page px-6">
        {/* Everything centered, single column */}
        <div className="flex flex-col items-center text-center">
          {/* Eyebrow */}
          <span className="inline-block rounded-full bg-accent-tint px-4 py-1.5 text-[13px] font-semibold uppercase text-accent-text tracking-wide mb-8">
            Stop guessing. Build what users want.
          </span>

          {/* Headline — large and bold like datafa.st */}
          <h1 className="text-[40px] md:text-[52px] lg:text-[56px] font-bold leading-[1.1] tracking-[-1px] text-text mb-5 max-w-3xl">
            Build what your users actually want
          </h1>

          {/* Subheadline — muted, smaller */}
          <p className="text-base md:text-lg leading-relaxed text-text-muted mb-10 max-w-xl">
            Collect feature requests and votes from inside your app, your website, and your community — all in one place. No sign-up for your users.
          </p>

          {/* Email input + CTA button — stacked layout like datafa.st */}
          {state === "success" ? (
            <p className="text-sm font-medium text-accent">
              You&apos;re on the list — we&apos;ll email you at launch.
            </p>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="w-full max-w-[380px] flex flex-col gap-3"
            >
              {/* Input with globe icon */}
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setState("idle");
                  }}
                  placeholder="you@example.com"
                  className="w-full rounded-btn border border-border bg-white pl-10 pr-4 py-3 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-accent/30"
                  required
                  aria-label="Email address"
                />
              </div>

              {/* Full-width CTA button below input */}
              <button
                type="submit"
                disabled={state === "submitting"}
                className="w-full rounded-btn bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-50 transition-colors"
              >
                {state === "submitting" ? "Joining..." : "Add my app →"}
              </button>
            </form>
          )}

          {state === "error" && (
            <p className="text-sm text-red-600 mt-2">
              That didn&apos;t send — try again.
            </p>
          )}

          {/* Fine print */}
          <p className="text-xs text-text-faint mt-3">
            Free plan · no card required
          </p>

          {/* Social proof — avatar stack */}
          <div className="flex items-center gap-3 mt-8">
            <div className="flex -space-x-2">
              {["B", "A", "M", "K"].map((letter, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-accent-tint border-2 border-page flex items-center justify-center text-xs font-semibold text-accent-text"
                >
                  {letter}
                </div>
              ))}
            </div>
            <span className="text-sm text-text-muted">
              Built in public — join early
            </span>
          </div>

          {/* Product mockup in a browser frame — below social proof */}
          <div className="mt-16 w-full max-w-2xl">
            {/* Browser chrome */}
            <div className="rounded-t-xl bg-neutral-800 px-4 py-3 flex items-center gap-3">
              {/* Traffic light dots */}
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              {/* URL bar */}
              <div className="flex-1 ml-2">
                <div className="rounded-md bg-neutral-700 px-3 py-1 text-[11px] text-neutral-400 font-mono truncate">
                  featurepoll.dev/board
                </div>
              </div>
            </div>

            {/* Browser content area */}
            <div className="rounded-b-xl border border-t-0 border-neutral-700 bg-neutral-900 p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Code block */}
                <div className="flex-1 w-full">
                  <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-2 font-semibold">
                    Integration
                  </div>
                  <code className="block font-mono text-sm leading-relaxed text-neutral-100">
                    <span className="text-blue-300">FeaturePoll</span>.
                    <span className="text-green-300">init</span>(
                    <span className="text-orange-300">
                      &apos;your-key&apos;
                    </span>
                    );
                    <br />
                    <span className="text-blue-300">FeaturePoll</span>.
                    <span className="text-green-300">openBoard</span>();
                  </code>
                </div>

                {/* Phone mockup inside browser */}
                <div className="w-44 shrink-0 rounded-2xl bg-white border border-neutral-200 shadow-sm p-3">
                  <div className="text-[10px] font-semibold text-text-muted mb-2 uppercase tracking-wide">
                    Feature Board
                  </div>
                  {[
                    { title: "Dark mode", votes: 24 },
                    { title: "Export CSV", votes: 18 },
                    { title: "Webhooks", votes: 12 },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="flex items-center justify-between py-1.5 border-t border-neutral-100"
                    >
                      <span className="text-[11px] text-text truncate">
                        {item.title}
                      </span>
                      <span className="flex items-center gap-0.5 text-[11px] font-semibold text-accent">
                        ▲ {item.votes}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
