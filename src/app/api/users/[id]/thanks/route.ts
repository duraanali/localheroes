import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// Initialize Convex client
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
}
const convex = new ConvexHttpClient(convexUrl);

// GET /api/users/:id/thanks
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    // Get user's thanks with hero information
    const thanks = await convex.query(api.heroes.getThanksByUser, {
      userId,
    });

    return NextResponse.json(thanks);
  } catch (error) {
    console.error("Error fetching user thanks:", error);
    return NextResponse.json(
      { error: "Failed to fetch user thanks" },
      { status: 500 }
    );
  }
}
