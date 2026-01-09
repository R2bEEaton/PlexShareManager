import { NextRequest, NextResponse } from "next/server";
import type { PlexMediaItem, PaginationInfo } from "@/types/library";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sectionId = searchParams.get("sectionId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "100");
    const search = searchParams.get("search") || "";
    const labelId = searchParams.get("labelId") || "";

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

    // Build URL with pagination
    const offset = (page - 1) * limit;
    const url = new URL(`${serverUrl}/library/sections/${sectionId}/all`);
    url.searchParams.append("X-Plex-Container-Start", offset.toString());
    url.searchParams.append("X-Plex-Container-Size", limit.toString());

    // Add label filter if provided
    if (labelId) {
      url.searchParams.append("label", labelId);
    }

    // Fetch library items
    const response = await fetch(url.toString(), {
      headers: {
        "X-Plex-Token": authToken,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch library items: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    let items: PlexMediaItem[] = (data.MediaContainer?.Metadata || []).map((item: any) => ({
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
    }));

    // Filter by search term if provided
    if (search) {
      items = items.filter((item) =>
        item.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = data.MediaContainer?.totalSize || items.length;
    const totalPages = Math.ceil(total / limit);

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
      items,
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
