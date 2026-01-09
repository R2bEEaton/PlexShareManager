"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useShareManager } from "@/hooks/use-share-manager";
import { Loader2 } from "lucide-react";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friendIds: string[];
  libraryIds: string[];
  itemRatingKeys?: string[];
  action: "add" | "remove";
  onSuccess?: () => void;
}

export function ShareDialog({
  open,
  onOpenChange,
  friendIds,
  libraryIds,
  itemRatingKeys,
  action,
  onSuccess,
}: ShareDialogProps) {
  const { shareContent, isSharing } = useShareManager();

  const handleConfirm = () => {
    const serverId = process.env.NEXT_PUBLIC_PLEX_SERVER_ID || "";

    shareContent(
      {
        friendIds,
        serverId,
        libraryIds,
        itemRatingKeys,
        action,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess?.();
        },
      }
    );
  };

  const actionText = action === "add" ? "share" : "unshare";
  const hasItems = itemRatingKeys && itemRatingKeys.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {action === "add"
              ? hasItems ? "Share Items" : "Share Libraries"
              : hasItems ? "Unshare Items" : "Unshare Libraries"
            }
          </DialogTitle>
          <DialogDescription>
            {hasItems ? (
              <>
                Are you sure you want to {actionText} {itemRatingKeys.length}{" "}
                {itemRatingKeys.length === 1 ? "item" : "items"} with {friendIds.length}{" "}
                {friendIds.length === 1 ? "friend" : "friends"}?
                <br />
                <span className="text-xs text-muted-foreground mt-1 block">
                  Items will be labeled and the library will be shared.
                </span>
              </>
            ) : (
              <>
                Are you sure you want to {actionText} {libraryIds.length}{" "}
                {libraryIds.length === 1 ? "library" : "libraries"} with {friendIds.length}{" "}
                {friendIds.length === 1 ? "friend" : "friends"}?
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSharing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSharing}
            variant={action === "remove" ? "destructive" : "default"}
          >
            {isSharing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {action === "add" ? "Share" : "Unshare"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
