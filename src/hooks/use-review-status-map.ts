import { useQuery } from "@tanstack/react-query";

interface ReviewStatusMapResponse {
  success: boolean;
  statusMap: Record<string, "shared" | "skipped" | null>;
  lastSync: number;
}

export function useReviewStatusMap() {
  return useQuery({
    queryKey: ["reviewStatusMap"],
    queryFn: async (): Promise<ReviewStatusMapResponse> => {
      const response = await fetch("/api/media-review/status-map");
      if (!response.ok) {
        throw new Error("Failed to fetch review status");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
