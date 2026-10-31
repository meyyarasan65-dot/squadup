"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn, initials } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  src: string | null;
  className?: string;
}

/** GitHub avatar with an initials fallback (seed profiles have no avatar). */
export function UserAvatar({ name, src, className }: UserAvatarProps) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-white/10",
        className,
      )}
    >
      {src && <AvatarPrimitive.Image src={src} alt={name} className="aspect-square h-full w-full object-cover" />}
      <AvatarPrimitive.Fallback
        delayMs={src ? 400 : 0}
        className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500/40 to-fuchsia-500/30 text-xs font-semibold text-white"
      >
        {initials(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
