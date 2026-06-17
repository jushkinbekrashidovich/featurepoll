"use client";

import { useState } from "react";
import { Copy, ExternalLink, RefreshCw } from "lucide-react";

interface SharePageClientProps {
  projectSlug: string;
  publishableKey: string;
}

type Language = "javascript" | "nextjs" | "flutter" | "swift";

const LANGUAGES: { id: Language; label: string; icon: string | null }[] = [
  { id: "javascript", label: "JavaScript", icon: "JS" },
  { id: "nextjs", label: "Next.js / React", icon: "⚛" },
  { id: "flutter", label: "Flutter", icon: null },
  { id: "swift", label: "Swift", icon: null },
];

function FlutterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7">
      <path d="M14.314 0L2.3 12 6 15.7 21.684.013h-7.357zm.014 11.072L7.857 17.53l6.47 6.47H21.7l-6.46-6.468 6.46-6.46h-7.37z" fill="#02569B"/>
    </svg>
  );
}

function SwiftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7">
      <path d="M7.508 0c-.287 0-.573 0-.86.002-.241.002-.48.005-.724.01-.132.003-.263.009-.395.015A9.154 9.154 0 004.18.2c-.4.07-.8.18-1.18.33a4.16 4.16 0 00-1.03.63 3.97 3.97 0 00-.77.91c-.2.34-.36.7-.47 1.08-.12.4-.2.81-.25 1.23-.04.34-.06.68-.07 1.02-.01.24-.01.49-.01.73V17.83c0 .24 0 .49.01.73.01.34.03.68.07 1.02.05.42.13.83.25 1.23.11.38.27.74.47 1.08.2.34.44.65.72.91.28.26.6.49.95.66.38.18.79.3 1.21.38.42.08.84.12 1.27.14.24.01.49.02.73.02h.86c9.39 0 14.07-7.36 14.07-7.36s-4.79 2.87-9.39.59c3.67-1.55 7.91-5.86 7.91-5.86-1.76 1.55-3.51 2.61-4.89 3.21-1.95.85-3.94 1.21-5.83.91a8.93 8.93 0 01-3.24-1.26c-.02-.01-.03-.02-.04-.03l-.01-.01c3.71 1.27 7.42-.07 10.21-2.41C9.68 9.01 5.79 4.2 5.79 4.2c1.69 2.01 3.58 3.48 5.57 4.42C9.47 7.1 8.32 5.3 7.56 4.08c1.28 1.21 5.57 4.41 5.57 4.41A17.22 17.22 0 017.5 0h.008z" fill="#F05138"/>
    </svg>
  );
}

export function SharePageClient({ projectSlug, publishableKey }: SharePageClientProps) {
  const [selectedLang, setSelectedLang] = useState<Language>("flutter");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const baseUrl = `https://featurepoll.uz/${projectSlug}`;

  const links = [
    { label: "Voting Board", url: baseUrl },
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
      <h1 className="text-lg font-bold text-text">Integrate</h1>
      <p className="mt-1 text-sm text-text-muted">
        Add FeaturePoll to your app or share the board publicly
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

      {/* Language selector */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-text">Select Your Preferred Language</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              onClick={() => setSelectedLang(lang.id)}
              className={`flex flex-col items-center gap-2 rounded-card border-2 p-4 transition-all duration-200 ${
                selectedLang === lang.id
                  ? "border-accent bg-accent-tint shadow-sm"
                  : "border-neutral-200 bg-white hover:border-accent/50 hover:shadow-sm"
              }`}
            >
              <span className="text-2xl">
                {lang.id === "flutter" ? <FlutterIcon /> : lang.id === "swift" ? <SwiftIcon /> : lang.icon}
              </span>
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
        <div className="mt-4 overflow-hidden rounded-card border border-neutral-200 bg-gradient-to-br from-neutral-900 to-neutral-800 shadow-sm">
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
