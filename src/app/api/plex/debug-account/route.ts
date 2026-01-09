import { NextResponse } from "next/server";

export async function GET() {
  try {
    const authToken = process.env.PLEX_AUTH_TOKEN;

    if (!authToken) {
      return NextResponse.json(
        { success: false, error: "Plex auth token not configured" },
        { status: 500 }
      );
    }

    // Get account info for this token
    const response = await fetch("https://plex.tv/api/v2/user", {
      headers: {
        "X-Plex-Token": authToken,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `Failed to fetch account info: ${response.status} ${response.statusText}`,
        hint: "Your auth token might be invalid or expired"
      });
    }

    const userData = await response.json();

    return NextResponse.json({
      success: true,
      account: {
        username: userData.username,
        email: userData.email,
        id: userData.id,
        title: userData.title || userData.username,
        thumb: userData.thumb,
      },
      tokenInfo: {
        tokenLength: authToken.length,
        tokenPreview: `${authToken.substring(0, 10)}...${authToken.substring(authToken.length - 5)}`,
      },
      message: "This is the account your auth token belongs to. Verify this is YOUR account!"
    });
  } catch (error: any) {
    console.error("Error checking account:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to check account"
      },
      { status: 500 }
    );
  }
}
