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
    const collection = searchParams.get("collection") || "test-collection";

    if (!ratingKey) {
      return NextResponse.json(
        { success: false, error: "ratingKey parameter is required" },
        { status: 400 }
      );
    }

    console.log(`[Test Collection] Attempting to add item ${ratingKey} to collection "${collection}"`);

    // First, fetch the existing item to get current collections
    const getUrl = `${serverUrl}/library/metadata/${ratingKey}?X-Plex-Token=${authToken}`;
    const getResponse = await fetch(getUrl, {
      headers: { "Accept": "application/json" }
    });

    let existingCollections: string[] = [];
    if (getResponse.ok) {
      const itemData = await getResponse.json();
      const metadata = itemData?.MediaContainer?.Metadata?.[0];
      existingCollections = metadata?.Collection?.map((c: any) => c.tag) || [];
      console.log(`[Test Collection] Existing collections:`, existingCollections);
    }

    // Add the new collection to existing ones
    const allCollections = [...existingCollections, collection];

    // Try different methods to add collection
    const attempts = [
      // Method 1: Indexed collection array
      () => {
        const fd = new URLSearchParams();
        allCollections.forEach((c, i) => {
          fd.append(`collection[${i}].tag.tag`, c);
        });
        return fd;
      },
      // Method 2: Simple collection parameter (multiple)
      () => {
        const fd = new URLSearchParams();
        allCollections.forEach(c => {
          fd.append("collection", c);
        });
        return fd;
      },
      // Method 3: With type parameter
      () => {
        const fd = new URLSearchParams();
        fd.append("type", "1");
        fd.append("id", ratingKey);
        allCollections.forEach((c, i) => {
          fd.append(`collection[${i}].tag.tag`, c);
        });
        return fd;
      },
    ];

    let response: Response | null = null;
    let successMethod = -1;
    let lastError = "";

    for (let i = 0; i < attempts.length; i++) {
      const formData = attempts[i]();
      const url = `${serverUrl}/library/metadata/${ratingKey}?X-Plex-Token=${authToken}`;

      console.log(`[Test Collection] Method ${i + 1} - Form data:`, formData.toString());

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
        console.log(`[Test Collection] Method ${successMethod} succeeded!`);
        break;
      } else {
        lastError = await response.text();
        console.log(`[Test Collection] Method ${i + 1} failed: ${response.status} ${lastError.substring(0, 200)}`);
      }
    }

    if (!response || !response.ok) {
      console.error(`[Test Collection] All methods failed`);
      return NextResponse.json({
        success: false,
        error: `All methods failed to add collection`,
        lastError: lastError.substring(0, 500),
      }, { status: 400 });
    }

    console.log(`[Test Collection] Success with method ${successMethod}!`);

    // Verify the collection was added
    const verifyResponse = await fetch(getUrl, {
      headers: { "Accept": "application/json" }
    });

    const itemData = verifyResponse.ok ? await verifyResponse.json() : null;
    const finalCollections = itemData?.MediaContainer?.Metadata?.[0]?.Collection?.map((c: any) => c.tag) || [];

    return NextResponse.json({
      success: true,
      message: `Successfully added item ${ratingKey} to collection "${collection}" using method ${successMethod}`,
      collectionAdded: collection,
      successfulMethod: successMethod,
      ratingKey,
      existingCollections,
      finalCollections,
    });
  } catch (error: any) {
    console.error("[Test Collection] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to add collection",
      },
      { status: 500 }
    );
  }
}
