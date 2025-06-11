import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { z } from "zod";
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

// Validation schema for hero creation
const createHeroSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  story: z.string().min(10, "Story must be at least 10 characters"),
  location: z.string().min(2, "Location must be at least 2 characters"),
  tags: z.array(z.string()).min(1, "At least one tag is required"),
  photo_url: z.string().url("Photo URL must be a valid URL"),
});

// GET /api/heroes
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tag = searchParams.get("tag");
    const location = searchParams.get("location");

    // Get heroes with optional filters
    const heroes = await convex.query(api.heroes.getHeroes, {
      tag: tag || undefined,
      location: location || undefined,
    });

    return NextResponse.json(heroes);
  } catch (error) {
    console.error("Error fetching heroes:", error);
    return NextResponse.json(
      { error: "Failed to fetch heroes" },
      { status: 500 }
    );
  }
}

// POST /api/heroes
export async function POST(req: Request) {
  try {
    // Get and verify the auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    // Parse and validate request body
    const body = await req.json();
    const validationResult = createHeroSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const heroData = validationResult.data;

    // Create the hero
    const hero = await convex.mutation(api.heroes.createHero, {
      ...heroData,
      userId: decoded.id,
    });

    return NextResponse.json(hero, { status: 201 });
  } catch (error) {
    console.error("Error creating hero:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to create hero" },
      { status: 500 }
    );
  }
}
