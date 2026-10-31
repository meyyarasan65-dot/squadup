/**
 * Fixed ambient backdrop for the signed-in app: colour wash, slowly drifting orbs,
 * a faded grid and decorative rings. Purely decorative; sits behind all content.
 */
export function AppBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="app-wash absolute inset-0" />

      <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_75%)]" />

      <div className="animate-drift absolute -left-24 top-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-[100px]" />
      <div
        className="animate-drift absolute -right-20 top-1/3 h-72 w-72 rounded-full bg-cyan-400/15 blur-[100px]"
        style={{ animationDelay: "-8s" }}
      />
      <div
        className="animate-drift absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-violet-500/15 blur-[120px]"
        style={{ animationDelay: "-15s" }}
      />

      {/* Concentric rings, top right */}
      <svg
        className="absolute -right-40 -top-40 h-[34rem] w-[34rem] text-white opacity-[0.07]"
        viewBox="0 0 400 400"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        <circle cx="200" cy="200" r="60" />
        <circle cx="200" cy="200" r="110" />
        <circle cx="200" cy="200" r="160" />
        <circle cx="200" cy="200" r="195" strokeDasharray="4 8" />
      </svg>

      {/* Dot cluster, bottom left */}
      <svg
        className="absolute -left-6 bottom-16 hidden h-40 w-40 text-white opacity-[0.12] sm:block"
        viewBox="0 0 100 100"
        fill="currentColor"
      >
        {Array.from({ length: 36 }, (_, i) => (
          <circle key={i} cx={8 + (i % 6) * 16} cy={8 + Math.floor(i / 6) * 16} r="1.6" />
        ))}
      </svg>

      {/* Soft fade so the page edge doesn't look hard-cut */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
