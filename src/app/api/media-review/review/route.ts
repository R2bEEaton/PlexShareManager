import { NextRequest, NextResponse } from "next/server";
import { markAsReviewed } from "@/lib/media-review-store";
import { ReviewRequest } from "@/types/media-review";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ReviewRequest;

    if (!body.ratingKeys || !Array.isArray(body.ratingKeys) || body.ratingKeys.length === 0) {
      return NextResponse.json(
        { success: false, error: "ratingKeys array is required" },
        { status: 400 }
      );
    }

    if (!body.action || !["shared", "skipped"].includes(body.action)) {
      return NextResponse.json(
        { success: false, error: "action must be 'shared' or 'skipped'" },
        { status: 400 }
      );
    }

    await markAsReviewed(body.ratingKeys, body.action);

    return NextResponse.json({
      success: true,
      message: `Marked ${body.ratingKeys.length} item(s) as ${body.action}`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to mark items as reviewed";
    console.error("Error marking items as reviewed:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
