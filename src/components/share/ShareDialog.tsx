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
  action: "add" | "remove";
  onSuccess?: () => void;
}

export function ShareDialog({
  open,
  onOpenChange,
  friendIds,
  libraryIds,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {action === "add" ? "Share Libraries" : "Unshare Libraries"}
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to {actionText} {libraryIds.length}{" "}
            {libraryIds.length === 1 ? "library" : "libraries"} with {friendIds.length}{" "}
            {friendIds.length === 1 ? "friend" : "friends"}?
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
