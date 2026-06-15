import type { Metadata } from "next";
import { Hero } from "./sections/Hero";
import { HowItWorks } from "./sections/HowItWorks";
import { Features } from "./sections/Features";
import { Pricing } from "./sections/Pricing";
import { FounderNote } from "./sections/FounderNote";

export const metadata: Metadata = {
  title: "FeaturePoll — feature voting for app, web & Telegram",
  description:
    "Collect feature requests and votes from inside your app, your website, and your Telegram community. Native SDK, anonymous voting, no sign-up for users.",
  keywords: [
    "Flutter feature voting",
    "in-app feedback",
    "feature request board",
    "mobile feedback SDK",
    "collect feature requests without sign-up",
    "feature voting Telegram",
  ],
  openGraph: {
    title: "FeaturePoll — feature voting for app, web & Telegram",
    description:
      "Collect feature requests and votes from inside your app, your website, and your community — all in one place.",
    url: "https://featurepoll.dev",
    siteName: "FeaturePoll",
    images: [
      { url: "/og-image.png", width: 1200, height: 630, alt: "FeaturePoll" },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FeaturePoll — feature voting for app, web & Telegram",
    description:
      "Collect feature requests and votes from inside your app, your website, and your community.",
    images: ["/og-image.png"],
  },
};

export default function LandingPage() {
  return (
    <main>
      <section id="hero" aria-label="Hero">
        <Hero />
      </section>
      <section aria-label="How it works">
        <HowItWorks />
      </section>
      <section id="features" aria-label="Features">
        <Features />
      </section>
      <Pricing />
      <section aria-label="Founder note">
        <FounderNote />
      </section>
    </main>
  );
}
