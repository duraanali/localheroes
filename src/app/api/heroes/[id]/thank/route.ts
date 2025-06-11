import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import jwt from "jsonwebtoken";

// Initialize Convex client
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
}
const convex = new ConvexHttpClient(convexUrl);

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}

// POST /api/heroes/:id/thank
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get and verify the auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    const heroId = params.id;

    // Add thank
    const result = await convex.mutation(api.heroes.thankHero, {
      heroId,
      userId: decoded.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error thanking hero:", error);

    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (error instanceof Error && error.message === "Already thanked") {
      return NextResponse.json(
        { error: "You have already thanked this hero" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to thank hero" },
      { status: 500 }
    );
  }
}
