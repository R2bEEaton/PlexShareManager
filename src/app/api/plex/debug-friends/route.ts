import { NextResponse } from "next/server";

export async function GET() {
  try {
    const authToken = process.env.PLEX_AUTH_TOKEN;

    if (!authToken) {
      return NextResponse.json(
        { success: false, error: "Plex auth token not configured" },
        { status: 500 }
      );
    }

    const results: any = {};

    // Try v2/friends
    try {
      const response = await fetch("https://plex.tv/api/v2/friends", {
        headers: { "X-Plex-Token": authToken, "Accept": "application/json" },
      });
      const data = await response.json();
      results.v2Friends = { count: Array.isArray(data) ? data.length : 0, data };
    } catch (e: any) {
      results.v2Friends = { error: e.message };
    }

    // Try v2/friends with includeInvitations
    try {
      const response = await fetch("https://plex.tv/api/v2/friends?includeInvitations=1", {
        headers: { "X-Plex-Token": authToken, "Accept": "application/json" },
      });
      const data = await response.json();
      results.v2FriendsWithInvitations = { count: Array.isArray(data) ? data.length : 0, data };
    } catch (e: any) {
      results.v2FriendsWithInvitations = { error: e.message };
    }

    // Try shared_servers endpoint
    try {
      const response = await fetch("https://plex.tv/api/v2/shared_servers", {
        headers: { "X-Plex-Token": authToken, "Accept": "application/json" },
      });
      const data = await response.json();
      results.sharedServers = { count: Array.isArray(data) ? data.length : 0, data };
    } catch (e: any) {
      results.sharedServers = { error: e.message };
    }

    // Try friends/all endpoint
    try {
      const response = await fetch("https://plex.tv/api/v2/friends/all", {
        headers: { "X-Plex-Token": authToken, "Accept": "application/json" },
      });
      const data = await response.json();
      results.friendsAll = { count: Array.isArray(data) ? data.length : 0, data };
    } catch (e: any) {
      results.friendsAll = { error: e.message };
    }

    // Try invites endpoint
    try {
      const response = await fetch("https://plex.tv/api/v2/invites/requested", {
        headers: { "X-Plex-Token": authToken, "Accept": "application/json" },
      });
      const data = await response.json();
      results.invites = { count: Array.isArray(data) ? data.length : 0, data };
    } catch (e: any) {
      results.invites = { error: e.message };
    }

    return NextResponse.json({
      success: true,
      ...results,
      summary: Object.entries(results).map(([key, value]: [string, any]) => ({
        endpoint: key,
        count: value.count || 0,
        hasError: !!value.error,
      })),
    });
  } catch (error: any) {
    console.error("Error debugging friends:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to debug friends"
      },
      { status: 500 }
    );
  }
}
