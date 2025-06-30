import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface AuthRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
  };
}

export function verifyJwt(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string };
  } catch (error) {
    return null;
  }
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
  try {
    return await convex.action(api.auth.isTokenBlacklisted, { token });
  } catch (error) {
    console.error("Error checking token blacklist:", error);
    return false;
  }
}

export function authMiddleware(
  handler: (req: AuthRequest) => Promise<NextResponse>
) {
  return async (req: AuthRequest) => {
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyJwt(token);

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check if token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      return NextResponse.json(
        { error: "Token has been revoked" },
        { status: 401 }
      );
    }

    req.user = decoded;
    return handler(req);
  };
}
