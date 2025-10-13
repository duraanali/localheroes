import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
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

// DELETE /api/heroes/:id/comments/:commentId
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    // Get and verify the auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET!) as { id: string };

    const { commentId } = params;
    const commentIdTyped = commentId as Id<"comments">;

    if (!commentId) {
      return NextResponse.json(
        { error: "Comment ID is required" },
        { status: 400 }
      );
    }

    // Delete comment
    const result = await convex.mutation(api.heroes.deleteHeroComment, {
      commentId: commentIdTyped,
      userId: decoded.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error deleting comment:", error);

    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (error instanceof Error) {
      if (error.message === "Comment not found") {
        return NextResponse.json(
          { error: "Comment not found" },
          { status: 404 }
        );
      }
      if (error.message === "Only the comment author can delete this comment") {
        return NextResponse.json(
          { error: "Only the comment author can delete this comment" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
