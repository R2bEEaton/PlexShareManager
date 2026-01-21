import { useQuery } from "@tanstack/react-query";
import type { CachedMediaItem } from "@/types/media-review";

interface NewMediaResponse {
  success: boolean;
  data?: {
    items: CachedMediaItem[];
    total: number;
  };
  error?: string;
}

interface UseNewMediaOptions {
  libraryId?: string;
  enabled?: boolean;
}

export function useNewMedia(options?: UseNewMediaOptions) {
  const { libraryId, enabled = true } = options || {};

  return useQuery({
    queryKey: ["newMedia", libraryId],
    queryFn: async (): Promise<NewMediaResponse> => {
      const params = new URLSearchParams();
      if (libraryId) {
        params.set("libraryId", libraryId);
      }

      const response = await fetch(`/api/media-review/new?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch new media");
      }
      return response.json();
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled,
  });
}
