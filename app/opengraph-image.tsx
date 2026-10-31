import { ImageResponse } from "next/og";

export const alt = "SquadUp: find hackathon teammates who can actually ship";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SKILLS = [
  { name: "TypeScript", pct: 48, color: "#3178c6" },
  { name: "Python", pct: 27, color: "#3572a5" },
  { name: "Go", pct: 15, color: "#00add8" },
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "72px",
          backgroundColor: "#09090b",
          backgroundImage:
            "radial-gradient(circle at 15% 10%, rgba(99,102,241,0.38), transparent 55%), radial-gradient(circle at 90% 90%, rgba(34,211,238,0.22), transparent 50%)",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 640 }}>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 800 }}>
            <span>Squad</span>
            <span style={{ color: "#38bdf8" }}>Up</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", fontSize: 68, fontWeight: 700, lineHeight: 1.08 }}>
            <span>Find teammates who can actually&nbsp;</span>
            <span style={{ color: "#a5b4fc" }}>ship.</span>
          </div>
          <div style={{ display: "flex", fontSize: 28, color: "#a1a1aa" }}>
            Hackathon matchmaking from skills verified on GitHub.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            width: 380,
            padding: 28,
            borderRadius: 24,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(24,24,27,0.85)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "#a1a1aa" }}>
            <span>Verified skills</span>
            <span style={{ color: "#34d399" }}>92% match</span>
          </div>
          {SKILLS.map((s) => (
            <div key={s.name} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22 }}>
                <span>{s.name}</span>
                <span style={{ color: "#a1a1aa" }}>{s.pct}%</span>
              </div>
              <div style={{ display: "flex", height: 10, borderRadius: 999, background: "#27272a" }}>
                <div style={{ width: `${s.pct * 2}%`, height: 10, borderRadius: 999, background: s.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
