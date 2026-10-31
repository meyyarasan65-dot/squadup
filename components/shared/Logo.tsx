import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  href?: string;
  showText?: boolean;
  size?: "sm" | "default" | "lg";
}

export function Logo({
  className,
  href = "/",
  showText = true,
  size = "default",
}: LogoProps) {
  const iconDimensions = size === "sm" ? 24 : size === "lg" ? 40 : 32;
  const iconContainerClass =
    size === "sm" ? "h-6 w-6" : size === "lg" ? "h-10 w-10" : "h-8 w-8";
  const textSizeClass =
    size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg";

  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2.5 font-bold tracking-tight transition-opacity hover:opacity-90",
        className,
      )}
    >
      <div
        style={{
          width: iconDimensions,
          height: iconDimensions,
          minWidth: iconDimensions,
          minHeight: iconDimensions,
        }}
        className={cn(
          "relative shrink-0 overflow-hidden rounded-xl border border-white/10 shadow-[0_0_20px_-3px_rgba(56,189,248,0.3)] transition-transform duration-200 group-hover:scale-105",
          iconContainerClass,
        )}
      >
        <Image
          src="/logo-icon.png"
          alt="SquadUp icon"
          width={iconDimensions}
          height={iconDimensions}
          priority
          className="h-full w-full object-cover"
        />
      </div>

      {showText && (
        <span
          className={cn(
            "bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text font-bold tracking-tight text-transparent",
            textSizeClass,
          )}
        >
          SquadUp
        </span>
      )}
    </Link>
  );
}
