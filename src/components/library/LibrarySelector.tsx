"use client";

import { useLibraries } from "@/hooks/use-libraries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface LibrarySelectorProps {
  value?: string;
  onChange: (value: string) => void;
}

export function LibrarySelector({ value, onChange }: LibrarySelectorProps) {
  const { data, isLoading, error } = useLibraries();

  if (isLoading) {
    return <Skeleton className="h-10 w-[200px]" />;
  }

  if (error) {
    return (
      <div className="text-sm text-destructive">
        Failed to load libraries
      </div>
    );
  }

  const libraries = data?.libraries || [];
  const movieLibraries = libraries.filter((lib) => lib.type === "movie");
  const showLibraries = libraries.filter((lib) => lib.type === "show");

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select library" />
      </SelectTrigger>
      <SelectContent>
        {movieLibraries.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-sm font-semibold">Movies</div>
            {movieLibraries.map((library) => (
              <SelectItem key={library.id} value={library.key}>
                {library.title}
              </SelectItem>
            ))}
          </>
        )}
        {showLibraries.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-sm font-semibold">TV Shows</div>
            {showLibraries.map((library) => (
              <SelectItem key={library.id} value={library.key}>
                {library.title}
              </SelectItem>
            ))}
          </>
        )}
        {libraries.length === 0 && (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            No libraries found
          </div>
        )}
      </SelectContent>
    </Select>
  );
}
