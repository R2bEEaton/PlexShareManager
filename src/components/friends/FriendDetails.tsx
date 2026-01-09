"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { PlexFriend } from "@/types/friend";
import { User, Film, Tv } from "lucide-react";
import { useLibraries } from "@/hooks/use-libraries";

interface FriendDetailsProps {
  friend: PlexFriend | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FriendDetails({ friend, open, onOpenChange }: FriendDetailsProps) {
  const { data: librariesData } = useLibraries();

  const { data: sharedData, isLoading } = useQuery({
    queryKey: ["sharedContent", friend?.id],
    queryFn: async () => {
      if (!friend?.id) return null;
      const response = await fetch(`/api/plex/shared-content?friendId=${friend.id}`);
      if (!response.ok) throw new Error("Failed to fetch shared content");
      return response.json();
    },
    enabled: !!friend?.id && open,
  });

  if (!friend) return null;

  const initials = friend.friendlyName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const avatarUrl = friend.thumb
    ? friend.thumb.startsWith("http")
      ? friend.thumb
      : `/api/plex/image?path=${encodeURIComponent(friend.thumb)}`
    : undefined;

  const sharedLibraryIds = sharedData?.sharedLibraries || [];
  const allLibraries = sharedData?.allLibraries || false;
  const libraries = librariesData?.libraries || [];

  const sharedLibraries = libraries.filter((lib) =>
    sharedLibraryIds.includes(lib.key)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <Avatar className="h-12 w-12">
              <AvatarImage src={avatarUrl} alt={friend.friendlyName} />
              <AvatarFallback>
                {initials || <User className="h-6 w-6" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle>{friend.friendlyName}</DialogTitle>
              <DialogDescription>@{friend.username}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-2">Shared Libraries</h3>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : allLibraries ? (
              <Badge variant="secondary" className="mb-2">
                All Libraries Shared
              </Badge>
            ) : sharedLibraries.length > 0 ? (
              <div className="space-y-2">
                {sharedLibraries.map((library) => (
                  <div
                    key={library.id}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    {library.type === "movie" ? (
                      <Film className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Tv className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{library.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {library.type}
                      </p>
                    </div>
                    <Badge variant="outline">Shared</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No libraries currently shared</p>
              </div>
            )}
          </div>

          {friend.sharedServers && friend.sharedServers.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Server Access</h3>
              {friend.sharedServers.map((server, index) => (
                <div key={index} className="text-sm text-muted-foreground">
                  {server.name && <p>Server: {server.name}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
