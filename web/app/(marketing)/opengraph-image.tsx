import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "FeaturePoll — Native Flutter Feature Voting";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #171717 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "#6366f1",
            marginBottom: 16,
          }}
        >
          FeaturePoll
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#a3a3a3",
            textAlign: "center",
            maxWidth: 800,
          }}
        >
          Native Flutter feature voting & in-app feedback
        </div>
        <div
          style={{
            fontSize: 20,
            color: "#737373",
            marginTop: 24,
          }}
        >
          3 lines of code · Anonymous · Offline-first
        </div>
      </div>
    ),
    { ...size }
  );
}
