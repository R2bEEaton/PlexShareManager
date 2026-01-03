import { useQuery } from "@tanstack/react-query";
import type { PlexMediaItem, PaginationInfo } from "@/types/library";

interface MediaItemsResponse {
  success: boolean;
  items: PlexMediaItem[];
  pagination: PaginationInfo;
}

interface UseMediaItemsOptions {
  sectionId?: string;
  page?: number;
  limit?: number;
  search?: string;
  enabled?: boolean;
}

export function useMediaItems(options: UseMediaItemsOptions) {
  const { sectionId, page = 1, limit = 100, search = "", enabled = true } = options;

  return useQuery({
    queryKey: ["mediaItems", sectionId, page, limit, search],
    queryFn: async (): Promise<MediaItemsResponse> => {
      if (!sectionId) {
        throw new Error("Section ID is required");
      }

      const params = new URLSearchParams({
        sectionId,
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) {
        params.append("search", search);
      }

      const response = await fetch(`/api/plex/library-items?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch media items");
      }
      return response.json();
    },
    enabled: enabled && !!sectionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
