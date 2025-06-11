import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import jwt from "jsonwebtoken";
import { Id } from "@/convex/_generated/dataModel";

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

// GET /api/heroes/:id
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const heroId = params.id as Id<"heroes">;

    // Get hero with comments and thanks
    const hero = await convex.query(api.heroes.getHeroById, {
      id: heroId,
    });

    if (!hero) {
      return NextResponse.json({ error: "Hero not found" }, { status: 404 });
    }

    return NextResponse.json(hero);
  } catch (error) {
    console.error("Error fetching hero:", error);
    return NextResponse.json(
      { error: "Failed to fetch hero" },
      { status: 500 }
    );
  }
}

// DELETE /api/heroes/:id
export async function DELETE(
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

    const heroId = params.id as Id<"heroes">;

    // Delete the hero
    await convex.mutation(api.heroes.deleteHero, {
      heroId,
      userId: decoded.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting hero:", error);

    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (error instanceof Error) {
      if (error.message === "Hero not found") {
        return NextResponse.json({ error: "Hero not found" }, { status: 404 });
      }
      if (error.message === "Only the creator can delete this hero") {
        return NextResponse.json(
          { error: "Only the creator can delete this hero" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to delete hero" },
      { status: 500 }
    );
  }
}
