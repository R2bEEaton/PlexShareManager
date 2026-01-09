import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const authToken = process.env.PLEX_AUTH_TOKEN;
    const serverUrl = process.env.PLEX_SERVER_URL;

    if (!authToken || !serverUrl) {
      return NextResponse.json(
        { success: false, error: "Plex configuration missing" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const ratingKey = searchParams.get("ratingKey");
    const label = searchParams.get("label") || "test-label";

    if (!ratingKey) {
      return NextResponse.json(
        { success: false, error: "ratingKey parameter is required" },
        { status: 400 }
      );
    }

    console.log(`[Test Label] Attempting to label item ${ratingKey} with "${label}"`);

    // First, fetch the existing item to get current labels
    const getUrl = `${serverUrl}/library/metadata/${ratingKey}?X-Plex-Token=${authToken}`;
    const getResponse = await fetch(getUrl, {
      headers: { "Accept": "application/json" }
    });

    let existingLabels: string[] = [];
    if (getResponse.ok) {
      const itemData = await getResponse.json();
      const metadata = itemData?.MediaContainer?.Metadata?.[0];
      existingLabels = metadata?.Label?.map((l: any) => l.tag) || [];
      console.log(`[Test Label] Existing labels:`, existingLabels);
    }

    // Add the new label to existing ones
    const allLabels = [...existingLabels, label];

    // Try different parameter formats
    const attempts = [
      // Method 1: Indexed array format
      () => {
        const fd = new URLSearchParams();
        allLabels.forEach((l, i) => {
          fd.append(`label[${i}].tag.tag`, l);
        });
        return fd;
      },
      // Method 2: Simple label parameter
      () => {
        const fd = new URLSearchParams();
        allLabels.forEach(l => {
          fd.append("label", l);
        });
        return fd;
      },
      // Method 3: Plex-style with type and includeExternalMedia
      () => {
        const fd = new URLSearchParams();
        fd.append("type", "1");
        fd.append("id", ratingKey);
        fd.append("includeExternalMedia", "1");
        allLabels.forEach((l, i) => {
          fd.append(`label[${i}].tag.tag`, l);
        });
        return fd;
      }
    ];

    let response: Response | null = null;
    let successMethod = -1;
    let lastError = "";

    for (let i = 0; i < attempts.length; i++) {
      const formData = attempts[i]();
      const url = `${serverUrl}/library/metadata/${ratingKey}?X-Plex-Token=${authToken}`;

      console.log(`[Test Label] Method ${i + 1} - Form data:`, formData.toString());

      response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
        },
        body: formData.toString(),
      });

      if (response.ok) {
        successMethod = i + 1;
        console.log(`[Test Label] Method ${successMethod} succeeded!`);
        break;
      } else {
        lastError = await response.text();
        console.log(`[Test Label] Method ${i + 1} failed: ${response.status} ${lastError}`);
      }
    }

    if (!response || !response.ok) {
      console.error(`[Test Label] All methods failed`);
      return NextResponse.json({
        success: false,
        error: `All methods failed to add label`,
        lastError,
      }, { status: 400 });
    }

    console.log(`[Test Label] Success with method ${successMethod}!`);

    // Verify the label was added
    const verifyResponse = await fetch(getUrl, {
      headers: { "Accept": "application/json" }
    });

    const itemData = verifyResponse.ok ? await verifyResponse.json() : null;
    const finalLabels = itemData?.MediaContainer?.Metadata?.[0]?.Label?.map((l: any) => l.tag) || [];

    return NextResponse.json({
      success: true,
      message: `Successfully labeled item ${ratingKey} with "${label}" using method ${successMethod}`,
      labelAdded: label,
      successfulMethod: successMethod,
      ratingKey,
      existingLabels,
      finalLabels,
      item: itemData,
    });
  } catch (error: any) {
    console.error("[Test Label] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to label item",
      },
      { status: 500 }
    );
  }
}
