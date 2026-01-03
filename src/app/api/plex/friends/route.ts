import { NextResponse } from "next/server";
import type { PlexFriend } from "@/types/friend";

export async function GET() {
  try {
    const authToken = process.env.PLEX_AUTH_TOKEN;

    if (!authToken) {
      return NextResponse.json(
        { success: false, error: "Plex auth token not configured" },
        { status: 500 }
      );
    }

    // Fetch friends from Plex.tv API
    const response = await fetch("https://plex.tv/api/v2/friends", {
      headers: {
        "X-Plex-Token": authToken,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch friends: ${response.statusText}`);
    }

    const data = await response.json();

    const friends: PlexFriend[] = (data || []).map((friend: any) => {
      const sharedServers = (friend.servers || []).map((server: any) => ({
        id: server.id?.toString() || "",
        name: server.name || "",
        libraryIds: server.sections?.map((s: any) => s.id?.toString() || "") || [],
        allLibraries: server.allLibraries || false,
      }));

      return {
        id: friend.id?.toString() || "",
        email: friend.email || "",
        username: friend.username || "",
        friendlyName: friend.friendlyName || friend.username || friend.title || "",
        thumb: friend.thumb || undefined,
        sharedServers,
      };
    });

    return NextResponse.json({
      success: true,
      friends,
    });
  } catch (error: any) {
    console.error("Error fetching friends:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch friends from Plex"
      },
      { status: 500 }
    );
  }
}
