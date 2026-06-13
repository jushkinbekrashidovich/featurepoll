import { CodeSnippet } from "@/components/code-snippet";
import { PhoneMockup } from "@/components/phone-mockup";
import { EmailCaptureForm } from "@/components/email-capture-form";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <div className="py-20 lg:py-32">
      <div className="mx-auto max-w-page px-6 lg:px-container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left column — text, code, CTA */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                Feature voting that lives inside your app
              </h1>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-lg">
                Add a native feature-request board to your Flutter app in 3
                lines of code. Anonymous voting, no WebView, works offline.
              </p>
            </div>

            <CodeSnippet />

            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" size="lg" href="#pricing">
                Start free
              </Button>
              <Button variant="secondary" size="lg" href="/docs">
                Read the docs
              </Button>
            </div>

            <EmailCaptureForm />
          </div>

          {/* Right column — phone mockup */}
          <div className="flex justify-center md:justify-end">
            <PhoneMockup />
          </div>
        </div>
      </div>
    </div>
  );
}
