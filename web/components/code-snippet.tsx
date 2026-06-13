export function CodeSnippet() {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-neutral-700 dark:border-neutral-600 bg-neutral-900 dark:bg-neutral-800 shadow-lg">
      {/* Header bar */}
      <div className="flex items-center gap-2 border-b border-neutral-700 dark:border-neutral-600 px-4 py-2">
        <span className="h-3 w-3 rounded-full bg-accent" />
        <span className="text-xs text-neutral-400 font-mono">main.dart</span>
      </div>

      {/* Code block */}
      <div className="overflow-x-auto p-4">
        <pre className="font-mono text-xs sm:text-sm leading-relaxed">
          <code>
            {/* Line 1: import statement */}
            <span className="text-purple-400">import</span>
            <span className="text-neutral-100"> </span>
            <span className="text-green-400">&apos;package:feature_poll/feature_poll.dart&apos;</span>
            <span className="text-neutral-100">;</span>
            {"\n"}
            {"\n"}
            {/* Line 2: await init */}
            <span className="text-purple-400">await</span>
            <span className="text-neutral-100"> FeaturePoll.</span>
            <span className="text-neutral-100">init(</span>
            <span className="text-green-400">&apos;your-publishable-key&apos;</span>
            <span className="text-neutral-100">);</span>
            {"\n"}
            {/* Line 3: openBoard */}
            <span className="text-neutral-100">FeaturePoll.</span>
            <span className="text-neutral-100">openBoard(</span>
            <span className="text-neutral-100">context</span>
            <span className="text-neutral-100">);</span>
          </code>
        </pre>
      </div>
    </div>
  );
}
