import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { SyncResult } from "@/types/media-review";

interface SyncResponse {
  success: boolean;
  data?: SyncResult;
  error?: string;
}

export function useMediaSync() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const syncMutation = useMutation({
    mutationFn: async (): Promise<SyncResponse> => {
      const response = await fetch("/api/media-review/sync", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to sync media");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["newMedia"] });
      queryClient.invalidateQueries({ queryKey: ["reviewStatus"] });

      if (data.success && data.data) {
        const { newItems, totalItems, librariesSynced } = data.data;
        toast({
          title: "Sync Complete",
          description: `Synced ${totalItems} items from ${librariesSynced} libraries. ${newItems.length} new items found.`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync media from Plex",
        variant: "destructive",
      });
    },
  });

  return {
    sync: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
    syncResult: syncMutation.data?.data,
  };
}
