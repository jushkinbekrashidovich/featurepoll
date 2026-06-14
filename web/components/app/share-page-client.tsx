"use client";

import { useState } from "react";
import { Copy, ExternalLink, RefreshCw, Info } from "lucide-react";

interface SharePageClientProps {
  projectSlug: string;
  publishableKey: string;
}

type Language = "javascript" | "nextjs" | "flutter" | "swift";

const LANGUAGES: { id: Language; label: string; icon: string }[] = [
  { id: "javascript", label: "JavaScript", icon: "JS" },
  { id: "nextjs", label: "Next.js / React", icon: "⚛" },
  { id: "flutter", label: "Flutter", icon: "🐦" },
  { id: "swift", label: "Swift", icon: "🍎" },
];

export function SharePageClient({ projectSlug, publishableKey }: SharePageClientProps) {
  const [selectedLang, setSelectedLang] = useState<Language>("flutter");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const baseUrl = `https://${projectSlug}.featurepoll.dev`;

  const links = [
    { label: "Voting Board", url: `${baseUrl}/board` },
    { label: "Roadmap", url: `${baseUrl}/roadmap` },
    { label: "Changelog", url: `${baseUrl}/changelog` },
  ];

  async function copyToClipboard(text: string, field: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Clipboard API not available
    }
  }

  function getCodeSnippet(lang: Language): string {
    switch (lang) {
      case "javascript":
        return `import FeaturePoll from '@featurepoll/js';

const poll = new FeaturePoll('${publishableKey}');
poll.openBoard();`;
      case "nextjs":
        return `import { FeaturePollBoard } from '@featurepoll/react';

export default function FeedbackPage() {
  return (
    <FeaturePollBoard publishableKey="${publishableKey}" />
  );
}`;
      case "flutter":
        return `import 'package:feature_poll/feature_poll.dart';

await FeaturePoll.init('${publishableKey}');
FeaturePoll.openBoard(context);`;
      case "swift":
        return `import FeaturePoll

FeaturePoll.initialize(key: "${publishableKey}")
FeaturePoll.openBoard(from: self)`;
    }
  }

  return (
    <div>
      <h1 className="text-lg font-bold text-text">Share & Embed</h1>
      <p className="mt-1 text-sm text-text-muted">
        Share your board publicly or embed it in your app
      </p>

      {/* Top section: Links + Token side by side */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Public Links */}
        <div className="rounded-card border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-text">Public Links</h2>
          <div className="mt-4 space-y-3">
            {links.map((link) => (
              <div key={link.label} className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-text-muted">{link.label}</p>
                  <p className="mt-0.5 font-mono text-xs text-text-faint">{link.url}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => copyToClipboard(link.url, link.label)}
                    className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-neutral-100 hover:text-text"
                    title="Copy link"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-neutral-100 hover:text-text"
                    title="Open in new tab"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  {copiedField === link.label && (
                    <span className="text-[10px] text-success">Copied!</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tokens */}
        <div className="rounded-card border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-text">Tokens</h2>
          <div className="mt-4">
            <p className="text-xs font-medium text-text-muted">Mobile Public Token</p>
            <div className="mt-1.5 flex items-center gap-2">
              <code className="flex-1 truncate rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-xs text-text">
                {publishableKey}
              </code>
              <button
                onClick={() => copyToClipboard(publishableKey, "token")}
                className="shrink-0 rounded-md p-1.5 text-text-muted transition-colors hover:bg-neutral-100 hover:text-text"
                title="Copy token"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                className="shrink-0 rounded-md p-1.5 text-text-muted transition-colors hover:bg-neutral-100 hover:text-text"
                title="Rotate key"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              {copiedField === "token" && (
                <span className="text-[10px] text-success">Copied!</span>
              )}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-text-faint">
              This is used when you are embedding the board in your mobile app via Flutter.
              The key is used to allow the board to take in parameter only for your app.
            </p>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="mt-4 flex items-start gap-2.5 rounded-card border border-blue-100 bg-blue-50 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
        <p className="text-xs text-blue-700">
          Looking for API keys to manage your board programmatically? Find them in your{" "}
          <a href={`/app/${projectSlug}/settings`} className="font-medium underline">
            project settings
          </a>
          .
        </p>
      </div>

      {/* Language selector */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-text">Select Your Preferred Language</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              onClick={() => setSelectedLang(lang.id)}
              className={`flex flex-col items-center gap-2 rounded-card border-2 p-4 transition-colors ${
                selectedLang === lang.id
                  ? "border-accent bg-accent-tint"
                  : "border-neutral-200 bg-white hover:border-neutral-300"
              }`}
            >
              <span className="text-2xl">{lang.icon}</span>
              <span
                className={`text-xs font-medium ${
                  selectedLang === lang.id ? "text-accent-text" : "text-text-muted"
                }`}
              >
                {lang.label}
              </span>
            </button>
          ))}
        </div>

        {/* Code snippet */}
        <div className="mt-4 overflow-hidden rounded-card border border-neutral-200 bg-neutral-900 shadow-sm">
          <div className="flex items-center justify-between border-b border-neutral-700 px-4 py-2">
            <span className="text-xs font-medium text-neutral-400">
              {LANGUAGES.find((l) => l.id === selectedLang)?.label}
            </span>
            <button
              onClick={() => copyToClipboard(getCodeSnippet(selectedLang), "code")}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-200"
            >
              <Copy className="h-3 w-3" />
              {copiedField === "code" ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="overflow-x-auto p-4">
            <code className="font-mono text-sm leading-relaxed text-neutral-100">
              {getCodeSnippet(selectedLang)}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}
