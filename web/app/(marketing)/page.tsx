import type { Metadata } from "next";
import { HeroSection } from "@/components/hero-section";
import { SocialProofStrip } from "@/components/social-proof-strip";
import { FeaturesSection } from "@/components/features-section";
import { PricingSection } from "@/components/pricing-section";

export const metadata: Metadata = {
  title: "FeaturePoll — Native Flutter Feature Voting & In-App Feedback",
  description:
    "Add a native feature-request board to your Flutter app in 3 lines of code. Anonymous voting, no WebView, works offline.",
  keywords: [
    "Flutter feature voting",
    "in-app feedback",
    "feature request board",
    "mobile feedback SDK",
  ],
  openGraph: {
    title: "FeaturePoll — Native Flutter Feature Voting",
    description:
      "Add a native feature-request board to your Flutter app in 3 lines of code.",
    url: "https://featurepoll.dev",
    siteName: "FeaturePoll",
    images: [
      { url: "/og-image.png", width: 1200, height: 630, alt: "FeaturePoll" },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FeaturePoll — Native Flutter Feature Voting",
    description:
      "Add a native feature-request board to your Flutter app in 3 lines of code.",
    images: ["/og-image.png"],
  },
};

export default function LandingPage() {
  return (
    <main>
      <section id="hero" aria-label="Hero">
        <HeroSection />
      </section>
      <section id="social-proof" aria-label="Social proof">
        <SocialProofStrip />
      </section>
      <section id="features" aria-label="Features">
        <FeaturesSection />
      </section>
      <section id="pricing" aria-label="Pricing">
        <PricingSection />
      </section>
    </main>
  );
}
