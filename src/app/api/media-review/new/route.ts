import { NextRequest, NextResponse } from "next/server";
import { getUnreviewedItems } from "@/lib/media-review-store";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const libraryId = searchParams.get("libraryId");

    let items = await getUnreviewedItems();

    // Filter by library if specified
    if (libraryId) {
      items = items.filter((item) => item.libraryId === libraryId);
    }

    return NextResponse.json({
      success: true,
      data: {
        items,
        total: items.length,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch new media";
    console.error("Error fetching new media:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
