import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sectionId = searchParams.get("sectionId");

    if (!sectionId) {
      return NextResponse.json(
        { success: false, error: "sectionId is required" },
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

    const url = `${serverUrl}/library/sections/${sectionId}/label?X-Plex-Token=${authToken}`;

    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch labels: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    const labels = (data.MediaContainer?.Directory || []).map((label: any) => ({
      id: label.id?.toString() || "",
      key: label.key || "",
      tag: label.tag || label.title || "",
      count: label.count || 0,
    }));

    return NextResponse.json({
      success: true,
      labels,
    });
  } catch (error: any) {
    console.error("Error fetching labels:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch labels from Plex"
      },
      { status: 500 }
    );
  }
}
