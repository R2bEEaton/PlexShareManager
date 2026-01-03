"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import type { PlexMediaItem } from "@/types/library";
import { Film, Tv } from "lucide-react";
import Image from "next/image";

interface MediaCardProps {
  item: PlexMediaItem;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
}

export function MediaCard({ item, selected, onSelect }: MediaCardProps) {
  const thumbUrl = item.thumb
    ? `/api/plex/image?path=${encodeURIComponent(item.thumb)}`
    : null;

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
        </div>
        <div className="p-3">
          <h3 className="font-semibold line-clamp-2 text-sm" title={item.title}>
            {item.title}
          </h3>
          {item.year && (
            <p className="text-xs text-muted-foreground mt-1">{item.year}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
