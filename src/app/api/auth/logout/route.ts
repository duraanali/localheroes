import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import jwt from "jsonwebtoken";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set");
}

// POST /api/auth/logout
export async function POST(req: Request) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      try {
        // Verify the token to ensure it's valid before logging out
        const decoded = jwt.verify(token, JWT_SECRET as string) as {
          id: string;
          email: string;
          exp?: number;
        };

        // Get token expiration time
        const expiresAt = decoded.exp || Date.now() / 1000 + 7 * 24 * 60 * 60; // 7 days from now

        // Add token to blacklist using the action
        await convex.action(api.auth.blacklistToken, {
          token,
          userId: decoded.id,
          expiresAt,
        });

        console.log(
          `User ${decoded.email} (${decoded.id}) logged out successfully - token blacklisted`
        );

        return NextResponse.json({
          success: true,
          message: "Logged out successfully",
          userId: decoded.id,
        });
      } catch (jwtError) {
        // Token is invalid or expired, but we still return success
        // since the goal is to log the user out regardless
        console.log("Logout attempted with invalid token");

        return NextResponse.json({
          success: true,
          message: "Logged out successfully (token was already invalid)",
        });
      }
    }

    // No token provided, still return success
    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
