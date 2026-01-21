"use client";

import { useMediaItems } from "@/hooks/use-media-items";
import { useLabels } from "@/hooks/use-labels";
import { useReviewStatusMap } from "@/hooks/use-review-status-map";
import { useFriends } from "@/hooks/use-friends";
import { useReviewActions } from "@/hooks/use-review-actions";
import { useShareManager } from "@/hooks/use-share-manager";
import { useMediaSync } from "@/hooks/use-media-sync";
import { MediaCard } from "./MediaCard";
import { LoadingGrid } from "../layout/Loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, Search, Grid3x3, List, X, Film, Tv, ArrowUpDown, RefreshCw, SkipForward, Share2, Users } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import type { PlexMediaItem } from "@/types/library";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

type SortOption = "title" | "addedAt";
type SortDirection = "asc" | "desc";

const ITEMS_PER_PAGE = 100;

interface MediaGridProps {
  sectionId?: string;
  selectedItems?: Set<string>;
  onSelectItem?: (itemId: string, selected: boolean) => void;
  labelFilter?: string; // Filter items by this label
  onClearFilter?: () => void;
}

export function MediaGrid({ sectionId, selectedItems, onSelectItem, labelFilter, onClearFilter }: MediaGridProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<SortOption>("addedAt");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [selectedFriendsForShare, setSelectedFriendsForShare] = useState<Set<string>>(new Set());

  // Fetch review status to show NEW badges
  const { data: reviewStatusData } = useReviewStatusMap();
  const reviewStatusMap = reviewStatusData?.statusMap || {};

  // Fetch friends for sharing
  const { data: friendsData } = useFriends();
  const friends = friendsData?.friends || [];

  // Review actions (skip)
  const { markAsReviewed, isReviewing } = useReviewActions();

  // Share manager
  const { shareContent, isSharing } = useShareManager();

  // Media sync
  const { sync, isSyncing } = useMediaSync();

  // Fetch labels for this section (only for single library, not "all")
  const { data: labelsData } = useLabels({
    sectionId: sectionId !== "all" ? sectionId : undefined,
    enabled: !!sectionId && sectionId !== "all",
  });

  // Find the label ID if we're filtering by a label
  const filterLabelId = useMemo(() => {
    if (!labelFilter || !labelsData) {
      return undefined;
    }
    const label = labelsData.find(l => l.tag === labelFilter);
    return label?.key;
  }, [labelFilter, labelsData]);

  // Fetch ALL items once (no search/sort params - we'll handle client-side)
  const { data, isLoading, error, isFetching } = useMediaItems({
    sectionId,
    limit: 10000, // Fetch all items
    labelId: filterLabelId,
    enabled: !!sectionId,
  });

  // Reset page when library changes
  useEffect(() => {
    setPage(1);
    setSearch("");
  }, [sectionId]);

  const allItems = data?.items || [];

  // Client-side filtering and sorting
  const processedItems = useMemo(() => {
    let items = [...allItems];

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      items = items.filter((item) =>
        item.title.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    items.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "title") {
        comparison = (a.title || "").localeCompare(b.title || "");
      } else if (sortBy === "addedAt") {
        const aTime = a.addedAt || 0;
        const bTime = b.addedAt || 0;
        comparison = aTime - bTime;
      }
      return sortDir === "desc" ? -comparison : comparison;
    });

    return items;
  }, [allItems, search, sortBy, sortDir]);

  // Client-side pagination
  const totalPages = Math.ceil(processedItems.length / ITEMS_PER_PAGE);
  const paginatedItems = processedItems.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortDir] = value.split("-") as [SortOption, SortDirection];
    setSortBy(newSortBy);
    setSortDir(newSortDir);
    setPage(1);
  };

  const handleRefresh = () => {
    // Sync with Plex and refresh the cache
    sync();
    queryClient.invalidateQueries({ queryKey: ["mediaItems", sectionId] });
    queryClient.invalidateQueries({ queryKey: ["reviewStatusMap"] });
  };

  const handleSkipSelected = () => {
    if (!selectedItems || selectedItems.size === 0) return;
    markAsReviewed({
      ratingKeys: Array.from(selectedItems),
      action: "skipped",
    });
    // Clear selection after skip
    if (onSelectItem) {
      selectedItems.forEach((id) => onSelectItem(id, false));
    }
  };

  const handleShareWithFriends = () => {
    if (!selectedItems || selectedItems.size === 0 || selectedFriendsForShare.size === 0) return;

    const serverId = process.env.NEXT_PUBLIC_PLEX_SERVER_ID || "";

    // Share content with selected friends
    shareContent({
      friendIds: Array.from(selectedFriendsForShare),
      serverId,
      action: "add",
      libraryIds: [],
      itemRatingKeys: Array.from(selectedItems),
    });

    // Mark as reviewed
    markAsReviewed({
      ratingKeys: Array.from(selectedItems),
      action: "shared",
    });

    // Clear selections
    setSelectedFriendsForShare(new Set());
    if (onSelectItem) {
      selectedItems.forEach((id) => onSelectItem(id, false));
    }

    toast({
      title: "Shared",
      description: `Shared ${selectedItems.size} items with ${selectedFriendsForShare.size} friends`,
    });
  };

  const toggleFriendForShare = (friendId: string) => {
    setSelectedFriendsForShare((prev) => {
      const next = new Set(prev);
      if (next.has(friendId)) {
        next.delete(friendId);
      } else {
        next.add(friendId);
      }
      return next;
    });
  };

  const currentSortValue = `${sortBy}-${sortDir}`;
  const isProcessing = isReviewing || isSharing || isSyncing;

  if (!sectionId) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        <p>Select a library to view its contents</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search media..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={currentSortValue} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="addedAt-desc">Recently Added</SelectItem>
              <SelectItem value="addedAt-asc">Oldest First</SelectItem>
              <SelectItem value="title-asc">Title (A-Z)</SelectItem>
              <SelectItem value="title-desc">Title (Z-A)</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
            className="h-10 px-3"
            title="Refresh from Plex"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
          <div className="flex items-center gap-1 border rounded-md p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 px-3"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 px-3"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Action bar when items are selected */}
      {selectedItems && selectedItems.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted/50 border rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {selectedItems.size} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSkipSelected}
              disabled={isProcessing}
            >
              <SkipForward className="h-4 w-4 mr-2" />
              Skip
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  disabled={isProcessing}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share with...
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {friends.length === 0 ? (
                  <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                    No friends found
                  </div>
                ) : (
                  <>
                    <div className="px-2 py-1.5 text-sm font-semibold">Select friends</div>
                    <DropdownMenuSeparator />
                    {friends.map((friend) => (
                      <DropdownMenuCheckboxItem
                        key={friend.id}
                        checked={selectedFriendsForShare.has(friend.id)}
                        onCheckedChange={() => toggleFriendForShare(friend.id)}
                        onSelect={(e: Event) => e.preventDefault()}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        {friend.username || friend.email || friend.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                    <DropdownMenuSeparator />
                    <div className="p-2">
                      <Button
                        size="sm"
                        className="w-full"
                        disabled={selectedFriendsForShare.size === 0 || isProcessing}
                        onClick={handleShareWithFriends}
                      >
                        Share with {selectedFriendsForShare.size} friend{selectedFriendsForShare.size !== 1 ? "s" : ""}
                      </Button>
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {labelFilter && onClearFilter && (
        <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              Showing items shared with this friend ({processedItems.length} items)
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilter}
          >
            <X className="h-4 w-4 mr-2" />
            Clear Filter
          </Button>
        </div>
      )}

      {isLoading ? (
        <LoadingGrid />
      ) : error ? (
        <div className="text-center p-8 text-destructive">
          <p>Failed to load media items</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      ) : processedItems.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">
          <p>{search ? "No items found" : "No items in this library"}</p>
        </div>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {paginatedItems.map((item) => (
                <MediaCard
                  key={item.id}
                  item={item}
                  selected={selectedItems?.has(item.ratingKey)}
                  onSelect={
                    onSelectItem
                      ? (selected) => onSelectItem(item.ratingKey, selected)
                      : undefined
                  }
                  labelFilter={labelFilter}
                  sectionId={item.sectionId || sectionId}
                  isNew={reviewStatusMap[item.ratingKey] === null}
                />
              ))}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="divide-y">
                {paginatedItems.map((item) => (
                  <MediaListItemInline
                    key={item.id}
                    item={item}
                    selected={selectedItems?.has(item.ratingKey)}
                    onSelect={
                      onSelectItem
                        ? (selected) => onSelectItem(item.ratingKey, selected)
                        : undefined
                    }
                    labelFilter={labelFilter}
                    sectionId={item.sectionId || sectionId}
                    isNew={reviewStatusMap[item.ratingKey] === null}
                  />
                ))}
              </div>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface MediaListItemInlineProps {
  item: PlexMediaItem;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  labelFilter?: string;
  sectionId?: string;
  isNew?: boolean;
}

function MediaListItemInline({ item, selected, onSelect, labelFilter, sectionId, isNew }: MediaListItemInlineProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const thumbUrl = item.thumb
    ? `/api/plex/image?path=${encodeURIComponent(item.thumb)}`
    : null;

  const removeLabelMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/plex/remove-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemRatingKeys: [item.ratingKey],
          label: labelFilter,
          sectionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove label");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mediaItems"] });
      toast({
        title: "Label removed",
        description: `Removed from shared items`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRemoveLabel = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeLabelMutation.mutate();
  };

  return (
    <div
      className={`flex items-center gap-4 p-3 hover:bg-accent cursor-pointer transition-colors ${
        selected ? "bg-accent/50" : ""
      }`}
      onClick={() => onSelect?.(!selected)}
    >
      {onSelect && (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox checked={selected} onCheckedChange={onSelect} />
        </div>
      )}

      <div className="relative w-12 h-16 flex-shrink-0 bg-muted rounded overflow-hidden">
        {thumbUrl ? (
          <Image
            src={thumbUrl}
            alt={item.title}
            fill
            className="object-cover"
            sizes="48px"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            {item.type === "movie" ? (
              <Film className="h-6 w-6 text-muted-foreground" />
            ) : (
              <Tv className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold truncate">{item.title}</h3>
          {isNew && (
            <Badge className="bg-green-500 hover:bg-green-500 text-white text-xs font-bold flex-shrink-0">
              NEW
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {item.year && <span>{item.year}</span>}
          {item.rating && (
            <span className="flex items-center gap-1">
              ⭐ {item.rating.toFixed(1)}
            </span>
          )}
          {item.duration && (
            <span>{Math.floor(item.duration / 60000)}min</span>
          )}
        </div>
      </div>

      {labelFilter && sectionId && (
        <Button
          size="sm"
          variant="destructive"
          onClick={handleRemoveLabel}
          disabled={removeLabelMutation.isPending}
        >
          <X className="h-4 w-4 mr-2" />
          Remove
        </Button>
      )}
    </div>
  );
}
