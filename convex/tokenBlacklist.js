import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Mutation to blacklist a token (called by the action)
export const blacklistTokenMutation = mutation({
  args: {
    token: v.string(),
    userId: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { token, userId, expiresAt } = args;

    // Add token to blacklist
    await ctx.db.insert("token_blacklist", {
      token,
      user_id: userId,
      expires_at: expiresAt,
      created_at: Date.now() / 1000, // Convert to seconds
    });

    return { success: true };
  },
});

// Query to get a blacklisted token
export const getBlacklistedToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("token_blacklist")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
  },
});

// Mutation to clean up expired blacklisted tokens
export const cleanupExpiredTokens = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now() / 1000;

    // Get all expired tokens
    const expiredTokens = await ctx.db
      .query("token_blacklist")
      .withIndex("by_expires_at", (q) => q.lt("expires_at", now))
      .collect();

    // Delete expired tokens
    for (const token of expiredTokens) {
      await ctx.db.delete(token._id);
    }

    return { deleted: expiredTokens.length };
  },
});
