"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-card border border-border bg-surface p-8 shadow-sm animate-pulse">
          <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-neutral-200" />
          <div className="mx-auto h-4 w-40 rounded bg-neutral-200" />
          <div className="mt-8 h-12 w-full rounded-btn bg-neutral-200" />
        </div>
      </div>
    </div>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get("error");

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  async function handleGoogleLogin() {
    setFormError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setFormError(error.message);
        setLoading(false);
      }
    } catch {
      setFormError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="rounded-card border border-border bg-surface p-8 shadow-sm">
          {/* Logo icon */}
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-white">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m17 11-5-5-5 5"/>
              <path d="m17 18-5-5-5 5"/>
            </svg>
          </div>

          {/* Tagline pill */}
          <div className="flex justify-center mb-5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs text-text-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              Stop guessing. Build what users want.
            </span>
          </div>

          {/* Welcome text */}
          <h1 className="text-xl font-bold text-text text-center mb-1">
            Welcome to Feature<span className="text-accent">Poll</span>
          </h1>
          <p className="text-sm text-text-muted text-center mb-8">
            Sign in to manage your feature boards
          </p>

          {/* Error messages */}
          {errorMessage && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
              {errorMessage}
            </div>
          )}
          {formError && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
              {formError}
            </div>
          )}

          {/* Google OAuth button — dark filled */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full rounded-btn bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2.5"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner />
                Redirecting...
              </span>
            ) : (
              <>
                <GoogleIcon />
                Continue with Google
              </>
            )}
          </button>

          {/* Terms */}
          <p className="mt-6 text-center text-[11px] text-text-faint leading-relaxed">
            By signing in, you agree to our{" "}
            <a href="/terms" className="underline hover:text-text-muted">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="underline hover:text-text-muted">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
