import { useQuery } from "@tanstack/react-query";
import type { ReviewStats } from "@/types/media-review";

interface ReviewStatusResponse {
  success: boolean;
  data?: ReviewStats;
  error?: string;
}

export function useReviewStatus() {
  return useQuery({
    queryKey: ["reviewStatus"],
    queryFn: async (): Promise<ReviewStatusResponse> => {
      const response = await fetch("/api/media-review/status");
      if (!response.ok) {
        throw new Error("Failed to fetch review status");
      }
      return response.json();
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
