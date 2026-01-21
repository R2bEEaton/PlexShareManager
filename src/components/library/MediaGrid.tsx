"use client";

import { useMediaItems, type SortOption, type SortDirection } from "@/hooks/use-media-items";
import { useLabels } from "@/hooks/use-labels";
import { MediaCard } from "./MediaCard";
import { LoadingGrid } from "../layout/Loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Search, Grid3x3, List, X, Film, Tv, ArrowUpDown } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import type { PlexMediaItem } from "@/types/library";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface MediaGridProps {
  sectionId?: string;
  selectedItems?: Set<string>;
  onSelectItem?: (itemId: string, selected: boolean) => void;
  labelFilter?: string; // Filter items by this label
  onClearFilter?: () => void;
}

export function MediaGrid({ sectionId, selectedItems, onSelectItem, labelFilter, onClearFilter }: MediaGridProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<SortOption>("addedAt");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

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

  const { data, isLoading, error } = useMediaItems({
    sectionId,
    page,
    search,
    labelId: filterLabelId,
    sortBy,
    sortDir,
    enabled: !!sectionId,
  });

  // Reset page when library changes
  useEffect(() => {
    setPage(1);
  }, [sectionId]);

  const items = data?.items || [];
  const pagination = data?.pagination;

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortDir] = value.split("-") as [SortOption, SortDirection];
    setSortBy(newSortBy);
    setSortDir(newSortDir);
    setPage(1);
  };

  const currentSortValue = `${sortBy}-${sortDir}`;

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

      {isLoading ? (
        <LoadingGrid />
      ) : error ? (
        <div className="text-center p-8 text-destructive">
          <p>Failed to load media items</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">
          <p>{search ? "No items found" : "No items in this library"}</p>
        </div>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {items.map((item) => (
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
                />
              ))}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="divide-y">
                {items.map((item) => (
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
                  />
                ))}
              </div>
            </div>
          )}

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

interface MediaListItemInlineProps {
  item: PlexMediaItem;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  labelFilter?: string;
  sectionId?: string;
}

function MediaListItemInline({ item, selected, onSelect, labelFilter, sectionId }: MediaListItemInlineProps) {
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
