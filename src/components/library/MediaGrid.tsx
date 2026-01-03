"use client";

import { useMediaItems } from "@/hooks/use-media-items";
import { MediaCard } from "./MediaCard";
import { LoadingGrid } from "../layout/Loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useState } from "react";

interface MediaGridProps {
  sectionId?: string;
  selectedItems?: Set<string>;
  onSelectItem?: (itemId: string, selected: boolean) => void;
}

export function MediaGrid({ sectionId, selectedItems, onSelectItem }: MediaGridProps) {
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
    return <LoadingGrid />;
  }

  if (error) {
    return (
      <div className="text-center p-8 text-destructive">
        <p>Failed to load media items</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  const items = data?.items || [];
  const pagination = data?.pagination;

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

      {items.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">
          <p>{search ? "No items found" : "No items in this library"}</p>
        </div>
      ) : (
        <>
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
              />
            ))}
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
