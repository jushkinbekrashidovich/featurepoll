"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

type FormState = "idle" | "submitting" | "success" | "error";

export function FinalCTA() {
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
      .insert({ email: email.trim(), source: "final-cta" });
    if (error) {
      setState("error");
    } else {
      setState("success");
    }
  }

  return (
    <section className="bg-accent py-16">
      <div className="mx-auto max-w-page px-6 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
          Find out what your users actually want
        </h2>
        <p className="text-sm text-white/70 mb-8">Free plan · no card required</p>

        {state === "success" ? (
          <p className="text-sm font-medium text-white">
            You&apos;re on the list — we&apos;ll email you at launch.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setState("idle"); }}
              placeholder="you@example.com"
              className="flex-1 rounded-btn bg-white px-4 py-2.5 text-sm text-text placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-white/50"
              required
              aria-label="Email address"
            />
            <button
              type="submit"
              disabled={state === "submitting"}
              className="rounded-btn bg-white px-6 py-2.5 text-sm font-semibold text-accent hover:bg-white/90 disabled:opacity-50 transition-colors"
            >
              {state === "submitting" ? "Joining..." : "Add my app"}
            </button>
          </form>
        )}
        {state === "error" && (
          <p className="text-sm text-white/80 mt-2">That didn&apos;t send — try again.</p>
        )}
      </div>
    </section>
  );
}
