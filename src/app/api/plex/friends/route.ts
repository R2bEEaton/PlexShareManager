import { NextResponse } from "next/server";
import type { PlexFriend } from "@/types/friend";
import { XMLParser } from "fast-xml-parser";

export async function GET() {
  try {
    const authToken = process.env.PLEX_AUTH_TOKEN;

    if (!authToken) {
      return NextResponse.json(
        { success: false, error: "Plex auth token not configured" },
        { status: 500 }
      );
    }

    // Use GraphQL API to fetch all friends (same as Plex web UI)
    const graphqlQuery = {
      query: `
        query GetAllFriends {
          allFriendsV2 {
            user {
              avatar
              displayName
              id
              username
              idRaw
            }
            createdAt
          }
        }
      `,
      operationName: "GetAllFriends"
    };

    const response = await fetch("https://community.plex.tv/api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-plex-token": authToken,
      },
      body: JSON.stringify(graphqlQuery),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch friends: ${response.statusText}`);
    }

    const data = await response.json();
    const allFriends = data?.data?.allFriendsV2 || [];

    const friends: PlexFriend[] = allFriends.map((friendData: any) => {
      const user = friendData.user;
      const friendId = user.id || user.idRaw?.toString();

      return {
        id: friendId || "",
        username: user.username || "",
        friendlyName: user.displayName || user.username || "",
        thumb: user.avatar || undefined
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
