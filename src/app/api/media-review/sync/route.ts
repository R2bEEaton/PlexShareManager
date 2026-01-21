import { NextResponse } from "next/server";
import { CachedMediaItem, SyncResult } from "@/types/media-review";
import { loadReviewData, saveReviewData } from "@/lib/media-review-store";

export async function POST() {
  try {
    const serverUrl = process.env.PLEX_SERVER_URL;
    const authToken = process.env.PLEX_AUTH_TOKEN;

    if (!serverUrl || !authToken) {
      return NextResponse.json(
        { success: false, error: "Plex server URL or auth token not configured" },
        { status: 500 }
      );
    }

    // Fetch library sections from Plex server
    const librariesResponse = await fetch(`${serverUrl}/library/sections`, {
      headers: {
        "X-Plex-Token": authToken,
        Accept: "application/json",
      },
    });

    if (!librariesResponse.ok) {
      throw new Error(
        `Failed to fetch libraries: ${librariesResponse.status} ${librariesResponse.statusText}`
      );
    }

    const librariesData = await librariesResponse.json();
    const libraries = librariesData.MediaContainer?.Directory || [];

    // Filter to only movie and show libraries
    const relevantLibraries = libraries.filter(
      (lib: { type: string }) => lib.type === "movie" || lib.type === "show"
    );

    const data = await loadReviewData();
    const previousCache = { ...data.mediaCache };
    const allNewItems: CachedMediaItem[] = [];
    let totalItems = 0;

    // Fetch all items from each relevant library
    for (const library of relevantLibraries) {
      const libraryId = library.key;
      const libraryType = library.type as "movie" | "show";

      // Fetch all items from this library
      const itemsResponse = await fetch(
        `${serverUrl}/library/sections/${libraryId}/all?X-Plex-Container-Size=10000`,
        {
          headers: {
            "X-Plex-Token": authToken,
            Accept: "application/json",
          },
        }
      );

      if (!itemsResponse.ok) {
        console.error(
          `Failed to fetch items from library ${libraryId}: ${itemsResponse.status}`
        );
        continue;
      }

      const itemsData = await itemsResponse.json();
      const rawItems = itemsData.MediaContainer?.Metadata || [];

      const cachedItems: CachedMediaItem[] = rawItems.map((item: {
        ratingKey?: string | number;
        title?: string;
        year?: number;
        addedAt?: number;
        thumb?: string;
      }) => ({
        ratingKey: String(item.ratingKey || ""),
        libraryId,
        title: item.title || "",
        type: libraryType,
        year: item.year,
        addedAt: item.addedAt || 0,
        thumb: item.thumb,
      }));

      // Find new items by comparing with previous cache
      const previousItems = previousCache[libraryId] || [];
      const previousKeys = new Set(previousItems.map((item) => item.ratingKey));

      const newItems = cachedItems.filter(
        (item) => !previousKeys.has(item.ratingKey)
      );

      // Also check if this is a brand new sync (no previous cache)
      // In that case, items without review status are considered new
      if (previousItems.length === 0 && data.lastSync > 0) {
        // Library was previously empty, all items are new
        allNewItems.push(...newItems);
      } else if (previousItems.length === 0 && data.lastSync === 0) {
        // First sync ever - don't mark anything as new
        // Users should start fresh
      } else {
        allNewItems.push(...newItems);
      }

      data.mediaCache[libraryId] = cachedItems;
      totalItems += cachedItems.length;
    }

    data.lastSync = Date.now();
    await saveReviewData(data);

    const result: SyncResult = {
      newItems: allNewItems,
      totalItems,
      librariesSynced: relevantLibraries.length,
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to sync media";
    console.error("Error syncing media:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
