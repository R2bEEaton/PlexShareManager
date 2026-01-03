import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { ShareRequest, ShareResponse } from "@/types/share";

export function useShareManager() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const shareMutation = useMutation({
    mutationFn: async (data: ShareRequest): Promise<ShareResponse> => {
      const response = await fetch("/api/plex/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update sharing");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate friends query to refresh shared content info
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["sharedContent"] });

      toast({
        title: "Success",
        description: data.message,
        variant: "default",
      });

      if (data.errors && data.errors.length > 0) {
        data.errors.forEach((error) => {
          toast({
            title: "Warning",
            description: error,
            variant: "destructive",
          });
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update sharing",
        variant: "destructive",
      });
    },
  });

  return {
    shareContent: shareMutation.mutate,
    isSharing: shareMutation.isPending,
  };
}
