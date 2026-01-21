"use client";

import { useState, useMemo } from "react";
import { useNewMedia } from "@/hooks/use-new-media";
import { useReviewActions } from "@/hooks/use-review-actions";
import { useFriends } from "@/hooks/use-friends";
import { useShareManager } from "@/hooks/use-share-manager";
import { ReviewableMediaCard } from "./ReviewableMediaCard";
import { ReviewToolbar } from "./ReviewToolbar";
import { ReviewStats } from "./ReviewStats";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Inbox, CheckCircle, SkipForward } from "lucide-react";

export function NewMediaReview() {
  const [libraryFilter, setLibraryFilter] = useState<string | undefined>();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const { data, isLoading, error } = useNewMedia({ libraryId: libraryFilter });
  const { data: friendsData } = useFriends();
  const { markAsReviewed, isReviewing } = useReviewActions();
  const { shareContent, isSharing } = useShareManager();

  const friends = friendsData?.friends || [];
  const items = data?.data?.items || [];

  const serverId = process.env.NEXT_PUBLIC_PLEX_SERVER_ID || "";

  const handleShare = (ratingKey: string, friendIds: string[]) => {
    // First, apply labels to share the content
    shareContent({
      friendIds,
      serverId,
      action: "add",
      libraryIds: [],
      itemRatingKeys: [ratingKey],
    });

    // Then mark as reviewed
    markAsReviewed({ ratingKeys: [ratingKey], action: "shared" });
  };

  const handleSkip = (ratingKey: string) => {
    markAsReviewed({ ratingKeys: [ratingKey], action: "skipped" });
  };

  const handleBulkSkip = () => {
    if (selectedItems.size > 0) {
      markAsReviewed({
        ratingKeys: Array.from(selectedItems),
        action: "skipped",
      });
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (ratingKey: string, selected: boolean) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(ratingKey);
      } else {
        next.delete(ratingKey);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map((item) => item.ratingKey)));
    }
  };

  const isProcessing = isReviewing || isSharing;

  return (
    <div className="space-y-6">
      <ReviewStats />

      <ReviewToolbar
        libraryFilter={libraryFilter}
        onLibraryFilterChange={setLibraryFilter}
      />

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[2/3] rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Failed to load new media</h3>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : "An error occurred"}
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">No new media to review</h3>
          <p className="text-muted-foreground">
            Click "Sync Now" to check for new content from Plex
          </p>
        </div>
      ) : (
        <>
          {items.length > 1 && (
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedItems.size === items.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
                {selectedItems.size > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {selectedItems.size} selected
                  </span>
                )}
              </div>
              {selectedItems.size > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkSkip}
                  disabled={isProcessing}
                  className="gap-2"
                >
                  <SkipForward className="h-4 w-4" />
                  Skip Selected
                </Button>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {items.map((item) => (
              <ReviewableMediaCard
                key={item.ratingKey}
                item={item}
                friends={friends}
                onShare={handleShare}
                onSkip={handleSkip}
                isProcessing={isProcessing}
                selected={selectedItems.has(item.ratingKey)}
                onSelect={(selected) =>
                  handleSelectItem(item.ratingKey, selected)
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
