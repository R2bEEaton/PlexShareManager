import { NextRequest, NextResponse } from "next/server";
import type { PlexMediaItem, PaginationInfo } from "@/types/library";

type SortOption = "title" | "addedAt";
type SortDirection = "asc" | "desc";

async function fetchLibrarySections(serverUrl: string, authToken: string): Promise<string[]> {
  const url = new URL(`${serverUrl}/library/sections`);
  const response = await fetch(url.toString(), {
    headers: {
      "X-Plex-Token": authToken,
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch library sections: ${response.status}`);
  }

  const data = await response.json();
  const sections = data.MediaContainer?.Directory || [];

  // Only include movie and show libraries
  return sections
    .filter((section: any) => section.type === "movie" || section.type === "show")
    .map((section: any) => section.key);
}

async function fetchSectionItems(
  serverUrl: string,
  authToken: string,
  sectionId: string,
  labelId?: string
): Promise<PlexMediaItem[]> {
  const url = new URL(`${serverUrl}/library/sections/${sectionId}/all`);

  // Fetch all items (we'll handle pagination ourselves after merging)
  url.searchParams.append("X-Plex-Container-Size", "10000");

  if (labelId) {
    url.searchParams.append("label", labelId);
  }

  const response = await fetch(url.toString(), {
    headers: {
      "X-Plex-Token": authToken,
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    console.error(`Failed to fetch section ${sectionId}: ${response.status}`);
    return [];
  }

  const data = await response.json();

  return (data.MediaContainer?.Metadata || []).map((item: any) => ({
    id: item.ratingKey?.toString() || "",
    key: item.key || "",
    ratingKey: item.ratingKey?.toString() || "",
    title: item.title || "",
    type: item.type || "movie",
    year: item.year || undefined,
    thumb: item.thumb || undefined,
    art: item.art || undefined,
    rating: item.rating || undefined,
    summary: item.summary || undefined,
    duration: item.duration || undefined,
    addedAt: item.addedAt || undefined,
    updatedAt: item.updatedAt || undefined,
    labels: item.Label?.map((l: any) => l.tag) || [],
    sectionId: sectionId,
  }));
}

function sortItems(items: PlexMediaItem[], sortBy: SortOption, sortDir: SortDirection): PlexMediaItem[] {
  return [...items].sort((a, b) => {
    let comparison = 0;

    if (sortBy === "title") {
      comparison = (a.title || "").localeCompare(b.title || "");
    } else if (sortBy === "addedAt") {
      const aTime = a.addedAt || 0;
      const bTime = b.addedAt || 0;
      comparison = aTime - bTime;
    }

    return sortDir === "desc" ? -comparison : comparison;
  });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sectionId = searchParams.get("sectionId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "100");
    const search = searchParams.get("search") || "";
    const labelId = searchParams.get("labelId") || "";
    const sortBy = (searchParams.get("sortBy") || "addedAt") as SortOption;
    const sortDir = (searchParams.get("sortDir") || "desc") as SortDirection;

    if (!sectionId) {
      return NextResponse.json(
        { success: false, error: "sectionId is required" },
        { status: 400 }
      );
    }

    const serverUrl = process.env.PLEX_SERVER_URL;
    const authToken = process.env.PLEX_AUTH_TOKEN;

    if (!serverUrl || !authToken) {
      return NextResponse.json(
        { success: false, error: "Plex server URL or auth token not configured" },
        { status: 500 }
      );
    }

    let allItems: PlexMediaItem[] = [];

    if (sectionId === "all") {
      // Fetch from all libraries
      const sectionIds = await fetchLibrarySections(serverUrl, authToken);

      // Fetch items from all sections in parallel
      const itemsArrays = await Promise.all(
        sectionIds.map((secId) => fetchSectionItems(serverUrl, authToken, secId, labelId || undefined))
      );

      allItems = itemsArrays.flat();
    } else {
      // Fetch from single library
      allItems = await fetchSectionItems(serverUrl, authToken, sectionId, labelId || undefined);
    }

    // Filter by search term if provided
    if (search) {
      allItems = allItems.filter((item) =>
        item.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sort items
    allItems = sortItems(allItems, sortBy, sortDir);

    // Apply pagination
    const total = allItems.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedItems = allItems.slice(offset, offset + limit);

    const pagination: PaginationInfo = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    return NextResponse.json({
      success: true,
      items: paginatedItems,
      pagination,
    });
  } catch (error: any) {
    console.error("Error fetching library items:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch library items from Plex"
      },
      { status: 500 }
    );
  }
}
