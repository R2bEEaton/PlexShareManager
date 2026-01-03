import { NextRequest, NextResponse } from "next/server";
import type { ShareRequest, ShareResponse } from "@/types/share";

export async function POST(request: NextRequest) {
  try {
    const body: ShareRequest = await request.json();
    const { friendIds, serverId, action, libraryIds } = body;

    if (!friendIds || friendIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "friendIds are required" },
        { status: 400 }
      );
    }

    if (!serverId) {
      return NextResponse.json(
        { success: false, message: "serverId is required" },
        { status: 400 }
      );
    }

    if (!libraryIds || libraryIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "libraryIds are required" },
        { status: 400 }
      );
    }

    if (!action || (action !== "add" && action !== "remove")) {
      return NextResponse.json(
        { success: false, message: "action must be 'add' or 'remove'" },
        { status: 400 }
      );
    }

    const authToken = process.env.PLEX_AUTH_TOKEN;
    if (!authToken) {
      return NextResponse.json(
        { success: false, message: "Plex auth token not configured" },
        { status: 500 }
      );
    }

    const errors: string[] = [];
    let successCount = 0;

    // Process each friend
    for (const friendId of friendIds) {
      try {
        if (action === "add") {
          // Share libraries with friend
          const response = await fetch(
            `https://plex.tv/api/servers/${serverId}/shared_servers`,
            {
              method: "POST",
              headers: {
                "X-Plex-Token": authToken,
                "Accept": "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                "server_id": serverId,
                "shared_server[library_section_ids][]": libraryIds.join(","),
                "shared_server[invited_id]": friendId,
              }).toString(),
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            errors.push(`Failed to share with friend ${friendId}: ${errorText}`);
          } else {
            successCount++;
          }
        } else {
          // Unshare libraries from friend
          const response = await fetch(
            `https://plex.tv/api/servers/${serverId}/shared_servers/${friendId}`,
            {
              method: "DELETE",
              headers: {
                "X-Plex-Token": authToken,
                "Accept": "application/json",
              },
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            errors.push(`Failed to unshare from friend ${friendId}: ${errorText}`);
          } else {
            successCount++;
          }
        }
      } catch (error: any) {
        errors.push(`Error processing friend ${friendId}: ${error.message}`);
      }
    }

    const result: ShareResponse = {
      success: successCount > 0,
      message: `Successfully ${action === "add" ? "shared" : "unshared"} with ${successCount} out of ${friendIds.length} friends`,
      errors: errors.length > 0 ? errors : undefined,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error in share endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update sharing"
      },
      { status: 500 }
    );
  }
}
