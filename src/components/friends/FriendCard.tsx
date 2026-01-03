"use client";

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { PlexFriend } from "@/types/friend";
import { User } from "lucide-react";

interface FriendCardProps {
  friend: PlexFriend;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
}

export function FriendCard({ friend, selected, onSelect }: FriendCardProps) {
  const initials = friend.friendlyName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const sharedLibrariesCount =
    friend.sharedServers?.reduce(
      (acc, server) => acc + (server.allLibraries ? Infinity : server.libraryIds.length),
      0
    ) || 0;

  // Use proxy for local Plex server images, direct URL for external images
  const avatarUrl = friend.thumb
    ? friend.thumb.startsWith("http")
      ? friend.thumb
      : `/api/plex/image?path=${encodeURIComponent(friend.thumb)}`
    : undefined;

  return (
    <Card
      className={`p-4 cursor-pointer transition-colors hover:bg-accent ${
        selected ? "bg-accent border-primary" : ""
      }`}
      onClick={() => onSelect?.(!selected)}
    >
      <div className="flex items-start gap-3">
        {onSelect && (
          <Checkbox
            checked={selected}
            onCheckedChange={onSelect}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        <Avatar>
          <AvatarImage src={avatarUrl} alt={friend.friendlyName} />
          <AvatarFallback>
            {initials || <User className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{friend.friendlyName}</h3>
          <p className="text-sm text-muted-foreground truncate">{friend.email}</p>
          <div className="mt-2">
            {sharedLibrariesCount === Infinity ? (
              <Badge variant="secondary">All Libraries</Badge>
            ) : sharedLibrariesCount > 0 ? (
              <Badge variant="secondary">
                {sharedLibrariesCount} {sharedLibrariesCount === 1 ? "Library" : "Libraries"}
              </Badge>
            ) : (
              <Badge variant="outline">No Access</Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
