"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

type FormState = "idle" | "submitting" | "success" | "error";

export function EmailCaptureForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Client-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage("Please enter a valid email address.");
      setState("error");
      return;
    }

    setState("submitting");
    const { error } = await supabase
      .from("waitlist")
      .insert({ email: email.trim() });

    if (error) {
      setErrorMessage("Something went wrong. Please try again.");
      setState("error");
    } else {
      setState("success");
    }
  }

  if (state === "success") {
    return (
      <p className="text-sm text-accent font-medium">
        You&apos;re on the list! We&apos;ll notify you when FeaturePoll launches.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md">
      <input
        type="email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setState("idle"); setErrorMessage(""); }}
        placeholder="you@example.com"
        className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
        required
        aria-label="Email address"
      />
      <button
        type="submit"
        disabled={state === "submitting"}
        className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
      >
        {state === "submitting" ? "Joining..." : "Join waitlist"}
      </button>
      {state === "error" && (
        <p className="text-sm text-red-500 dark:text-red-400 basis-full mt-1">{errorMessage}</p>
      )}
    </form>
  );
}
