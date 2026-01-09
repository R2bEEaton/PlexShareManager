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
    const { itemRatingKeys, label } = body;

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

    // Add label to each item
    const results = [];
    for (const ratingKey of itemRatingKeys) {
      try {
        const url = `${serverUrl}/library/metadata/${ratingKey}?X-Plex-Token=${authToken}`;

        // Use form data with Plex's standard label format
        const formData = new URLSearchParams();
        formData.append("type", "1"); // 1 = movie, 2 = show
        formData.append("id", ratingKey);
        formData.append("label[].tag.tag", label);
        formData.append("label.locked", "1");

        const response = await fetch(url, {
          method: "PUT",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
          },
          body: formData.toString(),
        });

        if (response.ok) {
          results.push({ ratingKey, success: true });
        } else {
          results.push({
            ratingKey,
            success: false,
            error: `Failed with status ${response.status}`
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
        ? `Successfully labeled ${results.length} items with "${label}"`
        : `Labeled ${results.filter(r => r.success).length}/${results.length} items`,
    });
  } catch (error: any) {
    console.error("Error labeling items:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to label items",
      },
      { status: 500 }
    );
  }
}
