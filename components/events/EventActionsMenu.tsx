"use client";

import { MoreHorizontal, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DeleteEventDialog } from "@/components/events/DeleteEventDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { HackathonEvent } from "@/types";

/** Secondary event actions, tucked away so the card keeps one clear primary action. */
export function EventActionsMenu({
  event,
  hasTeam,
  isAdmin,
  teamsCount,
}: {
  event: HackathonEvent;
  hasTeam: boolean;
  isAdmin: boolean;
  teamsCount: number;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`More actions for ${event.title}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/matchmaker?event=${event.id}`}>
              <Search />
              {hasTeam ? "Find teammates" : "Find a team"}
            </Link>
          </DropdownMenuItem>
          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onSelect={() => setDeleteOpen(true)}>
                <Trash2 />
                Delete event
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {isAdmin && (
        <DeleteEventDialog event={event} teamsCount={teamsCount} open={deleteOpen} onOpenChange={setDeleteOpen} />
      )}
    </>
  );
}
