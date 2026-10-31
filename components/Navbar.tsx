"use client";

import { motion } from "framer-motion";
import { CalendarDays, Inbox, LogOut, Menu, Sparkles, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";
import { Logo } from "@/components/shared/Logo";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useUiStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/matchmaker", label: "Matchmaker", icon: Sparkles },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/invites", label: "Invites", icon: Inbox },
  { href: "/profile", label: "Profile", icon: UserRound },
] as const;

interface NavbarProps {
  user: { name: string; avatarUrl: string | null; githubUsername: string };
  pendingInvites: number;
}

/** Squircle ghost buttons for the right-hand utility controls. */
const UTILITY_BTN =
  "flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/[0.06] hover:text-white";

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <motion.span
      key={count}
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative ml-auto inline-flex items-center justify-center rounded-full border border-sky-500/30 bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-medium text-sky-400 md:ml-1.5"
      aria-label={`${count} pending`}
    >
      {count > 9 ? "9+" : count}
    </motion.span>
  );
}

export function Navbar({ user, pendingInvites }: NavbarProps) {
  const pathname = usePathname();
  const { mobileNavOpen, setMobileNavOpen } = useUiStore();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
    <header className="sticky top-4 z-50 mt-4 px-4">
      {/* Floating glass island. The top-edge highlight is the ::before hairline. */}
      <div
        className={cn(
          "relative mx-auto flex max-w-6xl items-center gap-4 rounded-2xl border border-white/[0.08] bg-zinc-900/70 px-4 py-2.5 backdrop-blur-md",
          "shadow-[0_8px_32px_rgba(0,0,0,0.4)] [html.light_&]:shadow-[0_8px_32px_rgba(0,0,0,0.12)]",
          "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/15 before:to-transparent",
        )}
      >
        <Logo href="/" />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {LINKS.map(({ href, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center rounded-xl px-3.5 py-1.5 text-sm transition-all duration-200",
                  active ? "text-white" : "text-zinc-400 hover:bg-white/[0.04] hover:text-white",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-xl border border-white/[0.12] bg-white/[0.08] shadow-sm"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                {(active || href === "/matchmaker") && (
                  <span
                    className="relative mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"
                    aria-hidden
                  />
                )}
                <span className="relative">{label}</span>
                {href === "/invites" && <CountBadge count={pendingInvites} />}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <Link
            href="/profile"
            className="hidden cursor-pointer items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] py-1 pl-1 pr-3 text-sm text-zinc-300 transition hover:bg-white/[0.08] sm:flex"
          >
            <span className="relative">
              <UserAvatar name={user.name} src={user.avatarUrl} className="h-7 w-7" />
              <span
                className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-zinc-900"
                aria-hidden
              />
            </span>
            <span className="max-w-[140px] truncate font-mono text-xs">@{user.githubUsername}</span>
          </Link>

          <span className="mx-1 hidden h-4 w-px bg-white/[0.1] sm:block" aria-hidden />

          <ThemeToggle className={UTILITY_BTN} />
          <form action={signOutAction} className="hidden md:block">
            <Button type="submit" variant="ghost" size="icon" className={UTILITY_BTN} aria-label="Sign out">
              <LogOut />
            </Button>
          </form>

          <Button
            variant="ghost"
            size="icon"
            className={cn(UTILITY_BTN, "relative md:hidden")}
            aria-label="Open menu"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu />
            {pendingInvites > 0 && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-sky-400" aria-hidden />
            )}
          </Button>
        </div>
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="gap-6">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Logo href="/" />
          <div className="flex items-center gap-3 rounded-xl border border-zinc-800 p-3">
            <UserAvatar name={user.name} src={user.avatarUrl} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="truncate font-mono text-xs text-zinc-500">@{user.githubUsername}</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1" aria-label="Main">
            {LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileNavOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  isActive(href) ? "bg-zinc-800/80 text-white" : "text-zinc-400 hover:bg-zinc-900",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
                {href === "/invites" && <CountBadge count={pendingInvites} />}
              </Link>
            ))}
          </nav>
          <form action={signOutAction} className="mt-auto">
            <Button type="submit" variant="outline" className="w-full">
              <LogOut />
              Sign out
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </header>

    {/* Sibling of <header>: its backdrop-filter would otherwise trap this fixed bar inside the header. */}
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-zinc-950/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      aria-label="Primary"
    >
      <ul className="grid grid-cols-4">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-white" : "text-zinc-400 active:text-zinc-200",
                )}
              >
                {active && (
                  <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-300" />
                )}
                <span className="relative">
                  <Icon className={cn("h-5 w-5", active && "text-indigo-300")} aria-hidden />
                  {href === "/invites" && pendingInvites > 0 && (
                    <span
                      className="absolute -right-2 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-sky-500/30 bg-sky-500/20 px-1 text-[10px] font-medium text-sky-400"
                      aria-label={`${pendingInvites} pending`}
                    >
                      {pendingInvites > 9 ? "9+" : pendingInvites}
                    </span>
                  )}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
    </>
  );
}
