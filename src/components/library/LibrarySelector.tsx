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
import { Library } from "lucide-react";

interface LibrarySelectorProps {
  value?: string;
  onChange: (value: string) => void;
  showAllOption?: boolean;
}

export function LibrarySelector({ value, onChange, showAllOption = true }: LibrarySelectorProps) {
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
        {showAllOption && libraries.length > 0 && (
          <>
            <SelectItem value="all">
              <span className="flex items-center gap-2">
                <Library className="h-4 w-4" />
                All Libraries
              </span>
            </SelectItem>
            <div className="my-1 border-t" />
          </>
        )}
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
