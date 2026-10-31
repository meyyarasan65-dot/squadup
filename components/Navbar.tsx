"use client";

import { motion } from "framer-motion";
import { CalendarDays, Inbox, LogOut, Menu, Sparkles, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";
import { Logo } from "@/components/shared/Logo";
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

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <motion.span
      key={count}
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-500 px-1.5 font-mono text-[11px] font-semibold text-white md:ml-1"
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
    <header className="sticky top-0 z-40 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-xl">
      <div className="container flex h-14 items-center gap-6">
        <Logo href="/matchmaker" />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center rounded-md px-3 py-1.5 text-sm transition-colors",
                isActive(href) ? "text-white" : "text-zinc-400 hover:text-zinc-200",
              )}
            >
              {isActive(href) && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-md bg-zinc-800/80"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className="relative">{label}</span>
              {href === "/invites" && <CountBadge count={pendingInvites} />}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/profile"
            className="hidden items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm text-zinc-300 transition-colors hover:bg-zinc-900 sm:flex"
          >
            <UserAvatar name={user.name} src={user.avatarUrl} className="h-7 w-7" />
            <span className="max-w-[140px] truncate font-mono text-xs">@{user.githubUsername}</span>
          </Link>
          <form action={signOutAction} className="hidden md:block">
            <Button type="submit" variant="ghost" size="icon" aria-label="Sign out">
              <LogOut />
            </Button>
          </form>

          <Button
            variant="ghost"
            size="icon"
            className="relative md:hidden"
            aria-label="Open menu"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu />
            {pendingInvites > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-indigo-500" aria-hidden />
            )}
          </Button>
        </div>
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="gap-6">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Logo href="/matchmaker" />
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
  );
}
