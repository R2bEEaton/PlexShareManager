import { NextResponse } from "next/server";
import { getReviewStats } from "@/lib/media-review-store";

export async function GET() {
  try {
    const stats = await getReviewStats();

    return NextResponse.json({
      success: true,
      data: stats,
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
