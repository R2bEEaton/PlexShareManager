"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareManagerProps {
  selectedFriend: string | null;
  selectedLibrary: string | null;
  selectedItems: Set<string>;
  initialSharedItems: Set<string>;
  onClearSelection: () => void;
  onUpdateSuccess: () => void;
}

export function ShareManager({
  selectedFriend,
  selectedLibrary,
  selectedItems,
  initialSharedItems,
  onClearSelection,
  onUpdateSuccess,
}: ShareManagerProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  // Calculate changes
  const itemsToAdd = Array.from(selectedItems).filter(id => !initialSharedItems.has(id));
  const itemsToRemove = Array.from(initialSharedItems).filter(id => !selectedItems.has(id));
  const hasChanges = itemsToAdd.length > 0 || itemsToRemove.length > 0;

  const handleUpdateShares = async () => {
    if (!selectedFriend || !selectedLibrary) return;

    setIsUpdating(true);

    try {
      const results = [];

      // Add labels to newly selected items
      if (itemsToAdd.length > 0) {
        const addResponse = await fetch("/api/plex/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            friendIds: [selectedFriend],
            serverId: process.env.NEXT_PUBLIC_PLEX_SERVER_ID || "default",
            libraryIds: [selectedLibrary],
            itemRatingKeys: itemsToAdd,
            action: "add",
          }),
        });

        const addData = await addResponse.json();
        results.push({ action: "add", data: addData });
      }

      // Remove labels from deselected items
      if (itemsToRemove.length > 0) {
        const removeResponse = await fetch("/api/plex/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            friendIds: [selectedFriend],
            serverId: process.env.NEXT_PUBLIC_PLEX_SERVER_ID || "default",
            libraryIds: [selectedLibrary],
            itemRatingKeys: itemsToRemove,
            action: "remove",
          }),
        });

        const removeData = await removeResponse.json();
        results.push({ action: "remove", data: removeData });
      }

      // Check if all operations succeeded
      const allSuccess = results.every(r => r.data.success);

      if (allSuccess) {
        toast({
          title: "Success",
          description: `Updated shares: ${itemsToAdd.length} added, ${itemsToRemove.length} removed`,
        });
        onUpdateSuccess();
      } else {
        const errors = results.flatMap(r => r.data.errors || []);
        toast({
          title: "Partial Success",
          description: errors.length > 0 ? errors[0] : "Some operations failed",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update shares",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const hasSelection = selectedFriend && selectedLibrary;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Share Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasSelection ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Selected Items:</span>
                <Badge variant="secondary">{selectedItems.size}</Badge>
              </div>
              {hasChanges && (
                <div className="text-xs text-muted-foreground space-y-1">
                  {itemsToAdd.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-xs">+{itemsToAdd.length}</Badge>
                      <span>to share</span>
                    </div>
                  )}
                  {itemsToRemove.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs">-{itemsToRemove.length}</Badge>
                      <span>to unshare</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleUpdateShares}
                disabled={!hasChanges || isUpdating}
                className="w-full"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
                {isUpdating ? "Updating..." : hasChanges ? "Update Shares" : "No Changes"}
              </Button>
              <Button
                onClick={onClearSelection}
                variant="outline"
                className="w-full"
              >
                Clear Selection
              </Button>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Select a friend and library to manage item sharing
          </p>
        )}
      </CardContent>
    </Card>
  );
}
