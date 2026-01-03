"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { FriendsList } from "@/components/friends/FriendsList";
import { LibrarySelector } from "@/components/library/LibrarySelector";
import { MediaGrid } from "@/components/library/MediaGrid";
import { ShareManager } from "@/components/share/ShareManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  const [selectedLibrary, setSelectedLibrary] = useState<string>("");
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const handleSelectFriend = (friendId: string, selected: boolean) => {
    setSelectedFriends((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(friendId);
      } else {
        newSet.delete(friendId);
      }
      return newSet;
    });
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
    setSelectedFriends(new Set());
    setSelectedItems(new Set());
    setSelectedLibrary("");
  };

  // For the share manager, we need library IDs, not item IDs
  // In this implementation, we're sharing entire libraries, not individual items
  const selectedLibraries = selectedLibrary ? new Set([selectedLibrary]) : new Set<string>();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar - Friends */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Friends</CardTitle>
              </CardHeader>
              <CardContent>
                <FriendsList
                  selectedFriends={selectedFriends}
                  onSelectFriend={handleSelectFriend}
                />
              </CardContent>
            </Card>

            <div className="mt-6">
              <ShareManager
                selectedFriends={selectedFriends}
                selectedLibraries={selectedLibraries}
                onClearSelection={handleClearSelection}
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
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Select friends from the left sidebar, choose a library, and use the Share
            Manager to control access.
          </p>
        </div>
      </main>
    </div>
  );
}
