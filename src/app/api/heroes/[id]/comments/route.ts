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

// Validation schema for comment creation
const createCommentSchema = z.object({
  text: z.string().min(1, "Comment text is required"),
});

// GET /api/heroes/:id/comments
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const heroId = params.id;

    // Get comments for hero
    const comments = await convex.query(api.heroes.getHeroComments, {
      heroId,
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST /api/heroes/:id/comments
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

    // Parse and validate request body
    const body = await req.json();
    const validationResult = createCommentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const heroId = params.id;
    const { text } = validationResult.data;

    // Create comment
    const comment = await convex.mutation(api.heroes.createHeroComment, {
      heroId,
      userId: decoded.id,
      text,
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);

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
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
