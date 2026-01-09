"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { FriendsList } from "@/components/friends/FriendsList";
import { LibrarySelector } from "@/components/library/LibrarySelector";
import { MediaGrid } from "@/components/library/MediaGrid";
import { ShareManager } from "@/components/share/ShareManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { MousePointerClick, CheckSquare } from "lucide-react";
import { useLibraries } from "@/hooks/use-libraries";

export default function Home() {
  const [selectedLibrary, setSelectedLibrary] = useState<string>("");
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [initialSharedItems, setInitialSharedItems] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [browsingFriendId, setBrowsingFriendId] = useState<string | null>(null);

  // Fetch libraries to auto-select the first one
  const { data: librariesData } = useLibraries();

  // Auto-select first library on load
  useEffect(() => {
    if (!selectedLibrary && librariesData?.libraries && librariesData.libraries.length > 0) {
      setSelectedLibrary(librariesData.libraries[0].key);
    }
  }, [librariesData, selectedLibrary]);

  const handleSelectFriend = (friendId: string) => {
    setSelectedFriend(friendId);
    // Clear items when switching friends
    setSelectedItems(new Set());
    setInitialSharedItems(new Set());
  };

  const handleSelectItem = (itemId: string, selected: boolean) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(itemId);
      } else {
        newSet.delete(itemId);
      }
      return newSet;
    });
  };

  const handleClearSelection = () => {
    setSelectedFriend(null);
    setSelectedItems(new Set());
    setInitialSharedItems(new Set());
    setSelectedLibrary("");
  };

  const handleBrowseFriend = (friendId: string) => {
    setBrowsingFriendId(friendId);
    // Auto-select the first library if none selected
    if (!selectedLibrary) {
      // We'll need to get the first library, but for now just prompt user to select one
    }
  };

  // Fetch already-shared items when friend and library are selected in selection mode
  useEffect(() => {
    if (!selectionMode || !selectedFriend || !selectedLibrary) {
      console.log('[Fetch Shared Items] Skipping:', { selectionMode, selectedFriend, selectedLibrary });
      return;
    }

    const fetchSharedItems = async () => {
      try {
        const label = `shared-with-${selectedFriend}`;
        console.log('[Fetch Shared Items] Looking for label:', label);

        // First, fetch labels to find the ID
        const labelsRes = await fetch(`/api/plex/labels?sectionId=${selectedLibrary}`);
        const labelsData = await labelsRes.json();

        if (!labelsData.success) {
          console.error('[Fetch Shared Items] Failed to fetch labels');
          return;
        }

        console.log('[Fetch Shared Items] Available labels:', labelsData.labels.map((l: any) => l.tag));

        // Find the label ID (case-insensitive)
        const labelObj = labelsData.labels.find(
          (l: any) => l.tag.toLowerCase() === label.toLowerCase()
        );

        if (!labelObj) {
          // No items shared yet
          console.log('[Fetch Shared Items] No label found - clearing selections');
          setSelectedItems(new Set());
          setInitialSharedItems(new Set());
          return;
        }

        console.log('[Fetch Shared Items] Found label:', labelObj);

        // Fetch items with this label (use 'key' not 'id')
        const itemsRes = await fetch(
          `/api/plex/library-items?sectionId=${selectedLibrary}&labelId=${labelObj.key}&limit=1000`
        );
        const itemsData = await itemsRes.json();

        console.log('[Fetch Shared Items] Fetched items:', itemsData);

        if (itemsData.success) {
          const sharedItemKeys = new Set(
            itemsData.items.map((item: any) => item.ratingKey)
          );
          console.log('[Fetch Shared Items] Setting selected items:', sharedItemKeys.size, 'items');
          setSelectedItems(sharedItemKeys);
          setInitialSharedItems(sharedItemKeys);
        }
      } catch (error) {
        console.error('[Fetch Shared Items] Error:', error);
      }
    };

    fetchSharedItems();
  }, [selectionMode, selectedFriend, selectedLibrary]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar - Friends */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Friends</CardTitle>
                  <Button
                    variant={selectionMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const newMode = !selectionMode;
                      setSelectionMode(newMode);
                      // Always clear when toggling modes
                      setSelectedFriend(null);
                      setSelectedItems(new Set());
                      setInitialSharedItems(new Set());
                      if (!newMode) {
                        // Leaving selection mode, also clear browsing
                        setBrowsingFriendId(null);
                      }
                    }}
                  >
                    {selectionMode ? (
                      <>
                        <CheckSquare className="h-4 w-4 mr-2" />
                        Select Mode
                      </>
                    ) : (
                      <>
                        <MousePointerClick className="h-4 w-4 mr-2" />
                        Browse
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <FriendsList
                  selectedFriend={selectionMode ? selectedFriend : undefined}
                  onSelectFriend={selectionMode ? handleSelectFriend : undefined}
                  onBrowseFriend={!selectionMode ? handleBrowseFriend : undefined}
                  browsingFriendId={browsingFriendId}
                />
              </CardContent>
            </Card>

            <div className="mt-6">
              <ShareManager
                selectedFriend={selectedFriend}
                selectedLibrary={selectedLibrary}
                selectedItems={selectedItems}
                initialSharedItems={initialSharedItems}
                onClearSelection={handleClearSelection}
                onUpdateSuccess={() => {
                  // Refresh the initial shared items after successful update
                  setInitialSharedItems(new Set(selectedItems));
                }}
              />
            </div>
          </div>

          {/* Main content - Library browser */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Library Browser</CardTitle>
                  <LibrarySelector
                    value={selectedLibrary}
                    onChange={(value) => {
                      setSelectedLibrary(value);
                      setSelectedItems(new Set());
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Separator className="mb-6" />
                <MediaGrid
                  sectionId={selectedLibrary}
                  selectedItems={selectedItems}
                  onSelectItem={handleSelectItem}
                  labelFilter={browsingFriendId ? `shared-with-${browsingFriendId}` : undefined}
                  onClearFilter={() => setBrowsingFriendId(null)}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            {selectionMode ? (
              <>Select friends and a library, then use the Share Manager to control access.</>
            ) : (
              <>Click on a friend to view their current library access. Use Select Mode to manage shares.</>
            )}
          </p>
        </div>
      </main>
    </div>
  );
}
