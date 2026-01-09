import { NextRequest, NextResponse } from "next/server";
import type { ShareRequest, ShareResponse } from "@/types/share";

export async function POST(request: NextRequest) {
  try {
    const body: ShareRequest = await request.json();
    const { friendIds, serverId, action, libraryIds, itemRatingKeys } = body;

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
    const serverUrl = process.env.PLEX_SERVER_URL;

    if (!authToken) {
      return NextResponse.json(
        { success: false, message: "Plex auth token not configured" },
        { status: 500 }
      );
    }

    const errors: string[] = [];
    let successCount = 0;
    let labelingSuccessCount = 0;
    let labelingAttempted = false;

    // If specific items are provided, label/unlabel them for each friend
    if (itemRatingKeys && itemRatingKeys.length > 0) {
      labelingAttempted = true;

      if (!serverUrl) {
        return NextResponse.json(
          { success: false, message: "Plex server URL not configured" },
          { status: 500 }
        );
      }

      console.log(`[Share API] ${action === "add" ? "Adding" : "Removing"} labels for ${itemRatingKeys.length} items and ${friendIds.length} friends`);

      for (const friendId of friendIds) {
        const label = `shared-with-${friendId}`;
        console.log(`[Share API] ${action === "add" ? "Adding" : "Removing"} label "${label}" for friend ${friendId}`);

        let friendLabelingSuccess = true;

        try {
          // Label/unlabel each item using the correct Plex API endpoint
          // We need the library section ID - use the first libraryId from the request
          const sectionId = libraryIds[0];

          for (const ratingKey of itemRatingKeys) {
            // First, fetch existing labels for this item
            const getUrl = `${serverUrl}/library/metadata/${ratingKey}?X-Plex-Token=${authToken}`;
            const getResponse = await fetch(getUrl, {
              headers: { "Accept": "application/json" }
            });

            let existingLabels: string[] = [];
            if (getResponse.ok) {
              const itemData = await getResponse.json();
              const metadata = itemData?.MediaContainer?.Metadata?.[0];
              existingLabels = metadata?.Label?.map((l: any) => l.tag) || [];
            }

            let finalLabels: string[];
            let exactLabelToModify: string | undefined;

            if (action === "add") {
              // Add new label if not already present
              finalLabels = existingLabels.includes(label)
                ? existingLabels
                : [...existingLabels, label];
            } else {
              // Remove label - find exact match case-insensitively
              exactLabelToModify = existingLabels.find(
                l => l.toLowerCase() === label.toLowerCase()
              );

              if (!exactLabelToModify) {
                console.log(`[Share API] Item ${ratingKey}: Label "${label}" not found, skipping`);
                continue; // Skip this item if label not found
              }

              finalLabels = existingLabels.filter(l => l !== exactLabelToModify);
            }

            // Use the correct endpoint: /library/sections/{sectionId}/all
            const url = new URL(`${serverUrl}/library/sections/${sectionId}/all`);
            url.searchParams.append("type", "1"); // 1 = movie, 2 = show
            url.searchParams.append("id", ratingKey);
            url.searchParams.append("includeExternalMedia", "1");

            // Add all final labels
            finalLabels.forEach((lbl, index) => {
              url.searchParams.append(`label[${index}].tag.tag`, lbl);
            });

            // If removing, add the removal syntax
            if (action === "remove" && exactLabelToModify) {
              url.searchParams.append("label[].tag.tag-", exactLabelToModify);
            }

            url.searchParams.append("X-Plex-Token", authToken);

            console.log(`[Share API] ${action === "add" ? "Adding" : "Removing"} label for item ${ratingKey} (final labels: ${finalLabels.length})`);

            const response = await fetch(url.toString(), {
              method: "PUT",
              headers: {
                "Accept": "application/json",
              },
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error(`[Share API] Failed to modify label for item ${ratingKey}: ${response.status} ${errorText}`);
              errors.push(`Failed to modify label for item ${ratingKey}: ${response.status}`);
              friendLabelingSuccess = false;
            } else {
              console.log(`[Share API] Successfully modified label for item ${ratingKey}`);
            }
          }

          if (friendLabelingSuccess) {
            labelingSuccessCount++;
          }
        } catch (error: any) {
          console.error(`[Share API] Error modifying labels for friend ${friendId}:`, error);
          errors.push(`Failed to modify labels for friend ${friendId}: ${error.message}`);
        }
      }
    }

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

    const sharingType = itemRatingKeys && itemRatingKeys.length > 0
      ? `${itemRatingKeys.length} item${itemRatingKeys.length === 1 ? "" : "s"}`
      : `${libraryIds.length} librar${libraryIds.length === 1 ? "y" : "ies"}`;

    // Determine overall success based on what was attempted
    const overallSuccess = labelingAttempted
      ? labelingSuccessCount > 0  // If labeling was attempted, success based on labeling
      : successCount > 0;          // Otherwise, success based on library sharing

    const result: ShareResponse = {
      success: overallSuccess,
      message: labelingAttempted
        ? `Successfully labeled ${sharingType} for ${labelingSuccessCount} out of ${friendIds.length} friend${friendIds.length === 1 ? "" : "s"}`
        : `Successfully ${action === "add" ? "shared" : "unshared"} ${sharingType} with ${successCount} out of ${friendIds.length} friend${friendIds.length === 1 ? "" : "s"}`,
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
