import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json(
        { success: false, error: "path is required" },
        { status: 400 }
      );
    }

    const serverUrl = process.env.PLEX_SERVER_URL;
    const authToken = process.env.PLEX_AUTH_TOKEN;

    if (!serverUrl || !authToken) {
      return NextResponse.json(
        { success: false, error: "Plex server URL or auth token not configured" },
        { status: 500 }
      );
    }

    // Fetch image from Plex server with authentication
    const imageUrl = `${serverUrl}${path}?X-Plex-Token=${authToken}`;
    const response = await fetch(imageUrl);

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch image" },
        { status: response.status }
      );
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("Error fetching image:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch image"
      },
      { status: 500 }
    );
  }
}
