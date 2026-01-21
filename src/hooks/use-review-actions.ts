import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { ReviewRequest } from "@/types/media-review";

interface ReviewResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export function useReviewActions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const reviewMutation = useMutation({
    mutationFn: async (data: ReviewRequest): Promise<ReviewResponse> => {
      const response = await fetch("/api/media-review/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to mark items as reviewed");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["newMedia"] });
      queryClient.invalidateQueries({ queryKey: ["reviewStatus"] });

      const actionText = variables.action === "shared" ? "shared" : "skipped";
      toast({
        title: "Review Updated",
        description: `Marked ${variables.ratingKeys.length} item(s) as ${actionText}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update review status",
        variant: "destructive",
      });
    },
  });

  return {
    markAsReviewed: reviewMutation.mutate,
    isReviewing: reviewMutation.isPending,
  };
}
