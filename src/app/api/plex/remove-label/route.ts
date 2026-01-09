import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const authToken = process.env.PLEX_AUTH_TOKEN;
    const serverUrl = process.env.PLEX_SERVER_URL;

    if (!authToken || !serverUrl) {
      return NextResponse.json(
        { success: false, error: "Plex configuration missing" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { itemRatingKeys, label, sectionId } = body;

    console.log('[Remove Label] Request received:', { itemRatingKeys, label, sectionId });

    if (!itemRatingKeys || !Array.isArray(itemRatingKeys) || itemRatingKeys.length === 0) {
      return NextResponse.json(
        { success: false, error: "itemRatingKeys array is required" },
        { status: 400 }
      );
    }

    if (!label) {
      return NextResponse.json(
        { success: false, error: "label is required" },
        { status: 400 }
      );
    }

    if (!sectionId) {
      return NextResponse.json(
        { success: false, error: "sectionId is required" },
        { status: 400 }
      );
    }

    console.log(`[Remove Label] Removing label "${label}" from ${itemRatingKeys.length} items in section ${sectionId}`);

    const results = [];
    for (const ratingKey of itemRatingKeys) {
      try {
        // First, fetch existing labels for this item
        const getUrl = `${serverUrl}/library/metadata/${ratingKey}?X-Plex-Token=${authToken}`;
        console.log(`[Remove Label] Fetching metadata from: ${getUrl.replace(authToken, 'TOKEN')}`);

        const getResponse = await fetch(getUrl, {
          headers: { "Accept": "application/json" }
        });

        let existingLabels: string[] = [];
        if (getResponse.ok) {
          const itemData = await getResponse.json();
          const metadata = itemData?.MediaContainer?.Metadata?.[0];
          existingLabels = metadata?.Label?.map((l: any) => l.tag) || [];
          console.log(`[Remove Label] Item ${ratingKey} title: ${metadata?.title}`);
          console.log(`[Remove Label] Item ${ratingKey} existing labels:`, existingLabels);
        } else {
          console.log(`[Remove Label] Failed to fetch metadata: ${getResponse.status}`);
        }

        // Find the exact label that matches case-insensitively
        const exactLabelToRemove = existingLabels.find(
          l => l.toLowerCase() === label.toLowerCase()
        );

        if (!exactLabelToRemove) {
          console.log(`[Remove Label] Item ${ratingKey}: Label "${label}" not found (case-insensitive search)`);
          results.push({ ratingKey, success: false, error: 'Label not found on item' });
          continue;
        }

        console.log(`[Remove Label] Item ${ratingKey} exact label to remove: "${exactLabelToRemove}"`);

        // Filter out the label to remove
        const labelsToKeep = existingLabels.filter(l => l !== exactLabelToRemove);
        console.log(`[Remove Label] Item ${ratingKey} labels to keep:`, labelsToKeep);

        // Build URL with labels to keep and removal syntax for the target label
        const url = new URL(`${serverUrl}/library/sections/${sectionId}/all`);
        url.searchParams.append("type", "1"); // 1 = movie, 2 = show
        url.searchParams.append("id", ratingKey);
        url.searchParams.append("includeExternalMedia", "1");

        // Add labels we want to keep
        labelsToKeep.forEach((lbl, index) => {
          url.searchParams.append(`label[${index}].tag.tag`, lbl);
        });

        // Use Plex's removal syntax to remove the specific label (exact match from Plex)
        url.searchParams.append("label[].tag.tag-", exactLabelToRemove);

        url.searchParams.append("X-Plex-Token", authToken);

        const finalUrl = url.toString();
        console.log(`[Remove Label] Final PUT URL:`, finalUrl.replace(authToken, 'TOKEN'));
        console.log(`[Remove Label] URL params breakdown:`, {
          type: url.searchParams.get('type'),
          id: url.searchParams.get('id'),
          includeExternalMedia: url.searchParams.get('includeExternalMedia'),
          labelsToKeep: labelsToKeep,
          labelToRemove: exactLabelToRemove,
        });

        const response = await fetch(finalUrl, {
          method: "PUT",
          headers: {
            "Accept": "application/json",
          },
        });

        console.log(`[Remove Label] Response status: ${response.status} ${response.statusText}`);

        if (response.ok) {
          const responseText = await response.text();
          console.log(`[Remove Label] Response body:`, responseText.substring(0, 200));
          results.push({ ratingKey, success: true });
          console.log(`[Remove Label] ✓ Successfully removed "${exactLabelToRemove}" from item ${ratingKey}`);
        } else {
          const errorText = await response.text();
          console.log(`[Remove Label] ✗ Error response:`, errorText);
          results.push({
            ratingKey,
            success: false,
            error: `Failed with status ${response.status}: ${errorText}`
          });
        }
      } catch (error: any) {
        results.push({
          ratingKey,
          success: false,
          error: error.message
        });
      }
    }

    const allSuccessful = results.every(r => r.success);

    return NextResponse.json({
      success: allSuccessful,
      results,
      message: allSuccessful
        ? `Successfully removed label "${label}" from ${results.length} items`
        : `Removed label from ${results.filter(r => r.success).length}/${results.length} items`,
    });
  } catch (error: any) {
    console.error("Error removing label:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to remove label",
      },
      { status: 500 }
    );
  }
}
