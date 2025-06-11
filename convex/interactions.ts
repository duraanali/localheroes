import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Thanks functions
export const thankHero = mutation({
  args: {
    hero_id: v.string(),
    user_id: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user has already thanked this hero
    const existingThank = await ctx.db
      .query("thanks")
      .withIndex("by_hero_and_user", (q) =>
        q.eq("hero_id", args.hero_id).eq("user_id", args.user_id)
      )
      .first();

    if (existingThank) {
      throw new Error("User has already thanked this hero");
    }

    const thankId = await ctx.db.insert("thanks", {
      hero_id: args.hero_id,
      user_id: args.user_id,
      created_at: Date.now(),
    });

    return thankId;
  },
});

export const getThanksForHero = query({
  args: { hero_id: v.string() },
  handler: async (ctx, args) => {
    const thanks = await ctx.db
      .query("thanks")
      .withIndex("by_hero", (q) => q.eq("hero_id", args.hero_id))
      .collect();
    return thanks;
  },
});

// Comments functions
export const addComment = mutation({
  args: {
    hero_id: v.string(),
    user_id: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const commentId = await ctx.db.insert("comments", {
      ...args,
      created_at: Date.now(),
    });
    return commentId;
  },
});

export const getCommentsForHero = query({
  args: { hero_id: v.string() },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("by_hero", (q) => q.eq("hero_id", args.hero_id))
      .collect();
    return comments;
  },
}); 