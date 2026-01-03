"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Share2, Trash2 } from "lucide-react";
import { ShareDialog } from "./ShareDialog";

interface ShareManagerProps {
  selectedFriends: Set<string>;
  selectedLibraries: Set<string>;
  onClearSelection: () => void;
}

export function ShareManager({
  selectedFriends,
  selectedLibraries,
  onClearSelection,
}: ShareManagerProps) {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareAction, setShareAction] = useState<"add" | "remove">("add");

  const handleShare = (action: "add" | "remove") => {
    setShareAction(action);
    setShareDialogOpen(true);
  };

  const hasSelection = selectedFriends.size > 0 && selectedLibraries.size > 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Share Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Selected Friends:</span>
              <Badge variant="secondary">{selectedFriends.size}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Selected Libraries:</span>
              <Badge variant="secondary">{selectedLibraries.size}</Badge>
            </div>
          </div>

          {!hasSelection && (
            <p className="text-sm text-muted-foreground">
              Select friends and libraries to manage sharing
            </p>
          )}

          <div className="flex flex-col gap-2">
            <Button
              onClick={() => handleShare("add")}
              disabled={!hasSelection}
              className="w-full"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Selected Libraries
            </Button>
            <Button
              onClick={() => handleShare("remove")}
              disabled={!hasSelection}
              variant="destructive"
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Unshare Selected Libraries
            </Button>
            <Button
              onClick={onClearSelection}
              variant="outline"
              className="w-full"
              disabled={selectedFriends.size === 0 && selectedLibraries.size === 0}
            >
              Clear Selection
            </Button>
          </div>
        </CardContent>
      </Card>

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        friendIds={Array.from(selectedFriends)}
        libraryIds={Array.from(selectedLibraries)}
        action={shareAction}
        onSuccess={onClearSelection}
      />
    </>
  );
}
