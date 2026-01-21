"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMediaSync } from "@/hooks/use-media-sync";
import { useLibraries } from "@/hooks/use-libraries";
import { RefreshCw, Filter } from "lucide-react";

interface ReviewToolbarProps {
  libraryFilter?: string;
  onLibraryFilterChange: (libraryId: string | undefined) => void;
}

export function ReviewToolbar({
  libraryFilter,
  onLibraryFilterChange,
}: ReviewToolbarProps) {
  const { sync, isSyncing } = useMediaSync();
  const { data: librariesData, isLoading: librariesLoading } = useLibraries();

  const libraries = librariesData?.libraries?.filter(
    (lib) => lib.type === "movie" || lib.type === "show"
  ) || [];

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex items-center gap-4">
        <Button
          onClick={() => sync()}
          disabled={isSyncing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Syncing..." : "Sync Now"}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select
          value={libraryFilter || "all"}
          onValueChange={(value) =>
            onLibraryFilterChange(value === "all" ? undefined : value)
          }
          disabled={librariesLoading}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by library" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Libraries</SelectItem>
            {libraries.map((library) => (
              <SelectItem key={library.id} value={library.id}>
                {library.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
