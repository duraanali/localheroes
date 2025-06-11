import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createHero = mutation({
  args: {
    full_name: v.string(),
    story: v.string(),
    location: v.string(),
    tags: v.array(v.string()),
    photo_url: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { full_name, story, location, tags, photo_url, userId } = args;

    const heroId = await ctx.db.insert("heroes", {
      full_name,
      story,
      location,
      tags,
      photo_url,
      created_by: userId,
      created_at: Date.now() / 1000,
    });

    return await ctx.db.get(heroId);
  },
});

export const getHeroes = query({
  args: {
    tag: v.optional(v.string()),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let heroesQuery = ctx.db.query("heroes");

    if (args.tag) {
      heroesQuery = heroesQuery.filter((q) =>
        q.array(q.field("tags")).includes(args.tag)
      );
    }

    if (args.location) {
      heroesQuery = heroesQuery.filter((q) =>
        q.field("location").includes(args.location)
      );
    }

    const heroes = await heroesQuery.collect();

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

export const getHeroById = query({
  args: {
    id: v.id("heroes"),
  },
  handler: async (ctx, args) => {
    const hero = await ctx.db.get(args.id);
    if (!hero) return null;

    const comments = await ctx.db
      .query("comments")
      .filter((q) => q.eq(q.field("hero_id"), args.id))
      .collect();

    const thanks = await ctx.db
      .query("thanks")
      .filter((q) => q.eq(q.field("hero_id"), args.id))
      .collect();

    return {
      ...hero,
      comments,
      thanks_count: thanks.length,
    };
  },
});

export const getHeroesByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const heroes = await ctx.db
      .query("heroes")
      .filter((q) => q.eq(q.field("created_by"), args.userId))
      .collect();
    return heroes;
  },
});

export const thankHero = mutation({
  args: {
    heroId: v.id("heroes"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { heroId, userId } = args;

    const existingThank = await ctx.db
      .query("thanks")
      .filter((q) =>
        q.and(
          q.eq(q.field("hero_id"), heroId),
          q.eq(q.field("user_id"), userId)
        )
      )
      .first();

    if (existingThank) {
      throw new Error("Already thanked");
    }

    await ctx.db.insert("thanks", {
      hero_id: heroId,
      user_id: userId,
      created_at: Date.now() / 1000,
    });

    const thanks = await ctx.db
      .query("thanks")
      .filter((q) => q.eq(q.field("hero_id"), heroId))
      .collect();

    return {
      success: true,
      total: thanks.length,
    };
  },
});

export const getHeroComments = query({
  args: {
    heroId: v.id("heroes"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("comments")
      .filter((q) => q.eq(q.field("hero_id"), args.heroId))
      .collect();
  },
});

export const createHeroComment = mutation({
  args: {
    heroId: v.id("heroes"),
    userId: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const { heroId, userId, text } = args;

    const commentId = await ctx.db.insert("comments", {
      hero_id: heroId,
      user_id: userId,
      text,
      created_at: Date.now() / 1000,
    });

    return await ctx.db.get(commentId);
  },
});

// Delete a hero (only by creator)
export const deleteHero = mutation({
  args: {
    heroId: v.id("heroes"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { heroId, userId } = args;

    // Get the hero
    const hero = await ctx.db.get(heroId);
    if (!hero) {
      throw new Error("Hero not found");
    }

    // Check if user is the creator
    if (hero.created_by !== userId) {
      throw new Error("Only the creator can delete this hero");
    }

    // Delete all related data first
    // Delete comments
    const comments = await ctx.db
      .query("comments")
      .filter((q) => q.eq(q.field("hero_id"), heroId))
      .collect();

    for (const comment of comments) {
      await ctx.db.delete(comment._id);
    }

    // Delete thanks
    const thanks = await ctx.db
      .query("thanks")
      .filter((q) => q.eq(q.field("hero_id"), heroId))
      .collect();

    for (const thank of thanks) {
      await ctx.db.delete(thank._id);
    }

    // Finally delete the hero
    await ctx.db.delete(heroId);

    return { success: true };
  },
});
