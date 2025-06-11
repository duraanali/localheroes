import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// Initialize Convex client
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
}
const convex = new ConvexHttpClient(convexUrl);

// GET /api/users/:id/heroes
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    // Get user's heroes
    const heroes = await convex.query(api.users.getUserHeroes, {
      userId,
    });

    return NextResponse.json(heroes);
  } catch (error) {
    console.error("Error fetching user heroes:", error);
    return NextResponse.json(
      { error: "Failed to fetch user heroes" },
      { status: 500 }
    );
  }
}
