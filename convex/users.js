import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

// Mutation to create a user with pre-hashed password
export const createUserWithHash = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    hashedPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const { name, email, hashedPassword } = args;

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), email))
      .first();

    if (existingUser) {
      throw new Error("User already exists");
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      name,
      email,
      password: hashedPassword,
      created_at: Date.now() / 1000, // Convert to seconds for float64
    });

    return userId;
  },
});

// Query to get user by email
export const getUserByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
  },
});

// Mutation to verify password
export const verifyPassword = mutation({
  args: {
    userId: v.id("users"),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    return await ctx.runAction(api.auth.verifyPassword, {
      hashedPassword: user.password,
      password: args.password,
    });
  },
});

// Get user info with their heroes
export const getUserWithHeroes = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), args.userId))
      .first();

    if (!user) {
      return null;
    }

    // Get user's heroes
    const heroes = await ctx.db
      .query("heroes")
      .filter((q) => q.eq(q.field("created_by"), args.userId))
      .collect();

    // Get thanks count for each hero
    const heroesWithThanks = await Promise.all(
      heroes.map(async (hero) => {
        const thanks = await ctx.db
          .query("thanks")
          .filter((q) => q.eq(q.field("hero_id"), hero._id))
          .collect();

        return {
          ...hero,
          thanks_count: thanks.length,
        };
      })
    );

    return {
      ...user,
      heroes: heroesWithThanks,
    };
  },
});

// Get all heroes by a specific user
export const getUserHeroes = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const heroes = await ctx.db
      .query("heroes")
      .filter((q) => q.eq(q.field("created_by"), args.userId))
      .collect();

    // Get thanks count for each hero
    const heroesWithThanks = await Promise.all(
      heroes.map(async (hero) => {
        const thanks = await ctx.db
          .query("thanks")
          .filter((q) => q.eq(q.field("hero_id"), hero._id))
          .collect();

        return {
          ...hero,
          thanks_count: thanks.length,
        };
      })
    );

    return heroesWithThanks;
  },
});
