import { NextResponse } from "next/server";
import { loadReviewData } from "@/lib/media-review-store";

export async function GET() {
  try {
    const data = await loadReviewData();

    // Return a simple map of ratingKey -> action (or null if unreviewed)
    const statusMap: Record<string, "shared" | "skipped" | null> = {};

    // First, mark all cached items as null (unreviewed)
    for (const libraryId in data.mediaCache) {
      for (const item of data.mediaCache[libraryId]) {
        statusMap[item.ratingKey] = null;
      }
    }

    // Then overlay the review status
    for (const ratingKey in data.reviewStatus) {
      statusMap[ratingKey] = data.reviewStatus[ratingKey].action;
    }

    return NextResponse.json({
      success: true,
      statusMap,
      lastSync: data.lastSync,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch review status";
    console.error("Error fetching review status:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
