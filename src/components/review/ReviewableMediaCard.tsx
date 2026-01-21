"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CachedMediaItem } from "@/types/media-review";
import type { PlexFriend } from "@/types/friend";
import { Film, Tv, Share2, SkipForward, Users } from "lucide-react";
import Image from "next/image";

interface ReviewableMediaCardProps {
  item: CachedMediaItem;
  friends: PlexFriend[];
  onShare: (ratingKey: string, friendIds: string[]) => void;
  onSkip: (ratingKey: string) => void;
  isProcessing?: boolean;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
}

export function ReviewableMediaCard({
  item,
  friends,
  onShare,
  onSkip,
  isProcessing,
  selected,
  onSelect,
}: ReviewableMediaCardProps) {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());

  const thumbUrl = item.thumb
    ? `/api/plex/image?path=${encodeURIComponent(item.thumb)}`
    : null;

  const addedDate = new Date(item.addedAt * 1000).toLocaleDateString();

  const handleFriendToggle = (friendId: string) => {
    setSelectedFriends((prev) => {
      const next = new Set(prev);
      if (next.has(friendId)) {
        next.delete(friendId);
      } else {
        next.add(friendId);
      }
      return next;
    });
  };

  const handleShare = () => {
    if (selectedFriends.size > 0) {
      onShare(item.ratingKey, Array.from(selectedFriends));
      setShowShareDialog(false);
      setSelectedFriends(new Set());
    }
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSkip(item.ratingKey);
  };

  const handleOpenShareDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareDialog(true);
  };

  return (
    <>
      <Card
        className={`overflow-hidden transition-all hover:shadow-lg ${
          selected ? "ring-2 ring-primary" : ""
        } ${onSelect ? "cursor-pointer" : ""}`}
        onClick={() => onSelect?.(!selected)}
      >
        <CardContent className="p-0">
          <div className="relative aspect-[2/3] bg-muted">
            {thumbUrl ? (
              <Image
                src={thumbUrl}
                alt={item.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                {item.type === "movie" ? (
                  <Film className="h-16 w-16 text-muted-foreground" />
                ) : (
                  <Tv className="h-16 w-16 text-muted-foreground" />
                )}
              </div>
            )}
            {onSelect && (
              <div
                className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm rounded-md p-1"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox checked={selected} onCheckedChange={onSelect} />
              </div>
            )}
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="text-xs">
                {item.type === "movie" ? "Movie" : "Show"}
              </Badge>
            </div>
          </div>
          <div className="p-3 space-y-3">
            <div>
              <h3
                className="font-semibold line-clamp-2 text-sm"
                title={item.title}
              >
                {item.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                {item.year && <span>{item.year}</span>}
                <span>Added {addedDate}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 gap-1"
                onClick={handleOpenShareDialog}
                disabled={isProcessing}
              >
                <Share2 className="h-3 w-3" />
                Share
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1"
                onClick={handleSkip}
                disabled={isProcessing}
              >
                <SkipForward className="h-3 w-3" />
                Skip
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Share "{item.title}"
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[300px] pr-4">
            <div className="space-y-2">
              {friends.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No friends available
                </p>
              ) : (
                friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer"
                    onClick={() => handleFriendToggle(friend.id)}
                  >
                    <Checkbox
                      checked={selectedFriends.has(friend.id)}
                      onCheckedChange={() => handleFriendToggle(friend.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {friend.friendlyName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {friend.email}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleShare}
              disabled={selectedFriends.size === 0 || isProcessing}
            >
              Share with {selectedFriends.size} friend
              {selectedFriends.size !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
