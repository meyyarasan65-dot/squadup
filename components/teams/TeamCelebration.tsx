"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const COLORS = ["#818cf8", "#a78bfa", "#67e8f9", "#34d399", "#fbbf24", "#f472b6"];
const PIECES = 56;

interface Piece {
  id: number;
  x: number;
  drift: number;
  rotate: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  round: boolean;
}

/**
 * One-time confetti burst when the viewer's team has every seat filled.
 * Remembered per team in localStorage so a refresh doesn't replay it.
 */
export function TeamCelebration({ teamId, teamName }: { teamId: string; teamName: string }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    const key = `squadup:celebrated:${teamId}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {
      // Storage blocked: celebrate anyway; worst case it replays on reload.
    }

    toast.success("Squad complete! 🎉", { description: `${teamName} has every seat filled.` });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setPieces(
      Array.from({ length: PIECES }, (_, id) => ({
        id,
        x: Math.random() * 100,
        drift: (Math.random() - 0.5) * 240,
        rotate: (Math.random() - 0.5) * 900,
        delay: Math.random() * 0.5,
        duration: 2.2 + Math.random() * 1.6,
        size: 6 + Math.random() * 7,
        color: COLORS[id % COLORS.length]!,
        round: Math.random() > 0.6,
      })),
    );
    const timer = setTimeout(() => setPieces([]), 4500);
    return () => clearTimeout(timer);
  }, [teamId, teamName]);

  if (pieces.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className={p.round ? "absolute rounded-full" : "absolute rounded-[2px]"}
          style={{
            left: `${p.x}%`,
            top: -16,
            width: p.size,
            height: p.size * (p.round ? 1 : 0.5),
            backgroundColor: p.color,
          }}
          initial={{ y: 0, x: 0, rotate: 0, opacity: 1 }}
          animate={{ y: "105vh", x: p.drift, rotate: p.rotate, opacity: [1, 1, 0.8, 0] }}
          transition={{ delay: p.delay, duration: p.duration, ease: [0.2, 0.6, 0.4, 1] }}
        />
      ))}
    </div>
  );
}
