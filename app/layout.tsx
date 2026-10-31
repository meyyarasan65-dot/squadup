import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Squadup — Hackathon Teammate Matchmaker",
    template: "%s · Squadup",
  },
  description:
    "Find hackathon teammates by verified GitHub skills. Role-balanced matchmaking, 24-hour invites, real-time notifications.",
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${sans.variable} ${mono.variable}`}>
      <body className="min-h-dvh font-sans">
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: "!bg-zinc-900 !border-zinc-800 !text-zinc-100",
              description: "!text-zinc-400",
            },
          }}
        />
      </body>
    </html>
  );
}
