import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const friendId = searchParams.get("friendId");

    if (!friendId) {
      return NextResponse.json(
        { success: false, error: "friendId is required" },
        { status: 400 }
      );
    }

    const authToken = process.env.PLEX_AUTH_TOKEN;

    if (!authToken) {
      return NextResponse.json(
        { success: false, error: "Plex auth token not configured" },
        { status: 500 }
      );
    }

    // Fetch all friends to get shared server info
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

    // Find the specific friend
    const friend = (data || []).find(
      (f: any) => f.id?.toString() === friendId
    );

    if (!friend) {
      return NextResponse.json(
        { success: false, error: "Friend not found" },
        { status: 404 }
      );
    }

    // Get shared libraries for this friend
    const sharedLibraries: string[] = [];
    let allLibraries = false;

    if (friend.servers && friend.servers.length > 0) {
      const serverId = process.env.PLEX_SERVER_ID;
      const sharedServer = friend.servers.find(
        (s: any) => s.id?.toString() === serverId
      );

      if (sharedServer) {
        allLibraries = sharedServer.allLibraries || false;
        if (sharedServer.sections) {
          sharedServer.sections.forEach((section: any) => {
            if (section.id) {
              sharedLibraries.push(section.id.toString());
            }
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      sharedLibraries,
      allLibraries,
    });
  } catch (error: any) {
    console.error("Error fetching shared content:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch shared content"
      },
      { status: 500 }
    );
  }
}
