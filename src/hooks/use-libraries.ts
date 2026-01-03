import { useQuery } from "@tanstack/react-query";
import type { PlexLibrary } from "@/types/library";

interface LibrariesResponse {
  success: boolean;
  libraries: PlexLibrary[];
}

export function useLibraries() {
  return useQuery({
    queryKey: ["libraries"],
    queryFn: async (): Promise<LibrariesResponse> => {
      const response = await fetch("/api/plex/libraries");
      if (!response.ok) {
        throw new Error("Failed to fetch libraries");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
