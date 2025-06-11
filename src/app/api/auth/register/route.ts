import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import jwt from "jsonwebtoken";
import { z } from "zod";

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

// Validation schema
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: Request) {
  try {
    // Parse and validate request body
    const body = await req.json();
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = validationResult.data;

    // Check if user already exists
    const existingUser = await convex.query(api.users.getUserByEmail, {
      email,
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash the password using the auth action
    const hashedPassword = await convex.action(api.auth.hashPassword, {
      password,
    });

    // Create user with hashed password
    const userId = await convex.mutation(api.users.createUserWithHash, {
      name,
      email,
      hashedPassword,
    });

    if (!userId) {
      throw new Error("Failed to create user");
    }

    // Generate JWT
    const token = jwt.sign({ id: userId, email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return NextResponse.json({
      token,
      user: { id: userId, name, email },
    });
  } catch (error) {
    console.error("Registration error:", error);

    // Handle specific error cases
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
