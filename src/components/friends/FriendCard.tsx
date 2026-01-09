"use client";

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { PlexFriend } from "@/types/friend";
import { User, Copy, Check } from "lucide-react";
import { useState } from "react";

interface FriendCardProps {
  friend: PlexFriend;
  selected?: boolean;
  active?: boolean; // Highlighted when browsing this friend's content
  onSelect?: () => void;
  onViewDetails?: () => void;
}

export function FriendCard({ friend, selected, active, onSelect, onViewDetails }: FriendCardProps) {
  const [copied, setCopied] = useState(false);

  const initials = friend.friendlyName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Use proxy for local Plex server images, direct URL for external images
  const avatarUrl = friend.thumb
    ? friend.thumb.startsWith("http")
      ? friend.thumb
      : `/api/plex/image?path=${encodeURIComponent(friend.thumb)}`
    : undefined;

  const shareLabel = `shared-with-${friend.id}`;

  const handleClick = () => {
    if (onSelect) {
      onSelect();
    } else if (onViewDetails) {
      onViewDetails();
    }
  };

  const handleCopyLabel = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(shareLabel);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy label:', error);
    }
  };

  return (
    <Card
      className={`p-4 cursor-pointer transition-colors hover:bg-accent ${
        selected ? "bg-accent border-primary" : active ? "bg-primary/10 border-primary" : ""
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {onSelect && (
          <Checkbox
            checked={selected}
            onClick={(e) => e.stopPropagation()}
            onCheckedChange={(checked) => {
              // Radio-button style: always select when clicked
              if (!selected) {
                onSelect();
              }
            }}
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
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-1">
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded truncate max-w-[140px]" title={shareLabel}>
                {shareLabel}
              </code>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 flex-shrink-0"
                onClick={handleCopyLabel}
                title="Copy share label"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
