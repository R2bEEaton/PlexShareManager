"use client";

import { useFriends } from "@/hooks/use-friends";
import { FriendCard } from "./FriendCard";
import { LoadingList } from "../layout/Loading";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw } from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FriendsListProps {
  selectedFriend?: string | null;
  onSelectFriend?: (friendId: string) => void;
  onBrowseFriend?: (friendId: string) => void;
  browsingFriendId?: string | null;
}

export function FriendsList({
  selectedFriend,
  onSelectFriend,
  onBrowseFriend,
  browsingFriendId
}: FriendsListProps) {
  const { data, isLoading, error, refetch, isRefetching } = useFriends();
  const [search, setSearch] = useState("");

  if (isLoading) {
    return <LoadingList />;
  }

  if (error) {
    return (
      <div className="text-center p-8 text-destructive">
        <p>Failed to load friends</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  const friends = data?.friends || [];
  const filteredFriends = friends.filter(
    (friend) =>
      friend.friendlyName.toLowerCase().includes(search.toLowerCase()) ||
      friend.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search friends..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isRefetching}
          title="Refresh friends list"
        >
          <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {filteredFriends.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">
          <p>{search ? "No friends found" : "No friends yet"}</p>
        </div>
      ) : (
        <>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-2">
              {filteredFriends.map((friend) => (
                <FriendCard
                  key={friend.id}
                  friend={friend}
                  selected={selectedFriend === friend.id}
                  active={browsingFriendId === friend.id}
                  onSelect={
                    onSelectFriend
                      ? () => onSelectFriend(friend.id)
                      : undefined
                  }
                  onViewDetails={
                    onBrowseFriend
                      ? () => onBrowseFriend(friend.id)
                      : undefined
                  }
                />
              ))}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );
}
