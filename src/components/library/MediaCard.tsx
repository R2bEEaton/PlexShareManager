"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PlexMediaItem } from "@/types/library";
import { Film, Tv, X } from "lucide-react";
import Image from "next/image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface MediaCardProps {
  item: PlexMediaItem;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  labelFilter?: string; // If set, show remove button for this label
  sectionId?: string; // Needed for remove API call
  showLabels?: boolean; // Show all labels on the card
  isNew?: boolean; // Show NEW badge for unreviewed items
}

export function MediaCard({ item, selected, onSelect, labelFilter, sectionId, showLabels, isNew }: MediaCardProps) {
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
    <Card
      className={`overflow-hidden cursor-pointer transition-all hover:scale-105 ${
        selected ? "ring-2 ring-primary" : ""
      }`}
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
          {isNew && !labelFilter && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-green-500 hover:bg-green-500 text-white text-xs font-bold">
                NEW
              </Badge>
            </div>
          )}
          {labelFilter && sectionId && (
            <div className="absolute top-2 right-2">
              <Button
                size="sm"
                variant="destructive"
                className="h-8 w-8 p-0"
                onClick={handleRemoveLabel}
                disabled={removeLabelMutation.isPending}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-semibold line-clamp-2 text-sm" title={item.title}>
            {item.title}
          </h3>
          {item.year && (
            <p className="text-xs text-muted-foreground mt-1">{item.year}</p>
          )}
          {showLabels && item.labels && item.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.labels.map((label, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {label}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
