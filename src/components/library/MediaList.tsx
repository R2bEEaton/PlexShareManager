"use client";

import { useMediaItems } from "@/hooks/use-media-items";
import { LoadingList } from "../layout/Loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Search, Film, Tv, X } from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import type { PlexMediaItem } from "@/types/library";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface MediaListProps {
  sectionId?: string;
  selectedItems?: Set<string>;
  onSelectItem?: (itemId: string, selected: boolean) => void;
  labelFilter?: string;
  onClearFilter?: () => void;
  showLabels?: boolean;
}

export function MediaList({ sectionId, selectedItems, onSelectItem, labelFilter, onClearFilter, showLabels }: MediaListProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useMediaItems({
    sectionId,
    page,
    search,
    enabled: !!sectionId,
  });

  if (!sectionId) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        <p>Select a library to view its contents</p>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingList />;
  }

  if (error) {
    return (
      <div className="text-center p-8 text-destructive">
        <p>Failed to load media items</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  let items = data?.items || [];
  const pagination = data?.pagination;

  // Filter items by label if labelFilter is provided
  if (labelFilter) {
    items = items.filter(item => item.labels?.includes(labelFilter));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
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
        {selectedItems && selectedItems.size > 0 && (
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {selectedItems.size} selected
          </div>
        )}
      </div>

      {labelFilter && onClearFilter && (
        <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              Showing items shared with this friend ({items.length} items)
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

      {items.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">
          <p>{search ? "No items found" : "No items in this library"}</p>
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <div className="divide-y">
              {items.map((item) => (
                <MediaListItem
                  key={item.id}
                  item={item}
                  selected={selectedItems?.has(item.ratingKey)}
                  onSelect={
                    onSelectItem
                      ? (selected) => onSelectItem(item.ratingKey, selected)
                      : undefined
                  }
                  labelFilter={labelFilter}
                  sectionId={sectionId}
                  showLabels={showLabels}
                />
              ))}
            </div>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={!pagination.hasPrev}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={!pagination.hasNext}
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

interface MediaListItemProps {
  item: PlexMediaItem;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  labelFilter?: string;
  sectionId?: string;
  showLabels?: boolean;
}

function MediaListItem({ item, selected, onSelect, labelFilter, sectionId, showLabels }: MediaListItemProps) {
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
        <h3 className="font-semibold truncate">{item.title}</h3>
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
        {showLabels && item.labels && item.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {item.labels.map((label, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {label}
              </Badge>
            ))}
          </div>
        )}
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
