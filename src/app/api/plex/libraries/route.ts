import { NextResponse } from "next/server";
import type { PlexLibrary } from "@/types/library";

export async function GET() {
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
    const response = await fetch(`${serverUrl}/library/sections`, {
      headers: {
        "X-Plex-Token": authToken,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch libraries: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    const libraries: PlexLibrary[] = (data.MediaContainer?.Directory || []).map((dir: any) => ({
      id: dir.key || "",
      key: dir.key || "",
      title: dir.title || "",
      type: dir.type || "movie",
      agent: dir.agent || "",
      scanner: dir.scanner || "",
      language: dir.language || "",
      uuid: dir.uuid || "",
      updatedAt: dir.updatedAt || 0,
      createdAt: dir.createdAt || 0,
      scannedAt: dir.scannedAt || 0,
    }));

    return NextResponse.json({
      success: true,
      libraries,
    });
  } catch (error: any) {
    console.error("Error fetching libraries:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch libraries from Plex"
      },
      { status: 500 }
    );
  }
}
