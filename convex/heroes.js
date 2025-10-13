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

    // Get user information for each comment
    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("_id"), comment.user_id))
          .first();

        return {
          id: comment._id,
          text: comment.text,
          created_by: comment.user_id,
          created_at: comment.created_at,
          user: user
            ? {
                id: user._id,
                name: user.name,
                email: user.email,
                avatarUrl: user.avatarUrl,
              }
            : null,
        };
      })
    );

    const thanks = await ctx.db
      .query("thanks")
      .filter((q) => q.eq(q.field("hero_id"), args.id))
      .collect();

    return {
      ...hero,
      comments: commentsWithUsers,
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
      userId: userId,
      total: thanks.length,
    };
  },
});

export const getHeroComments = query({
  args: {
    heroId: v.id("heroes"),
  },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("comments")
      .filter((q) => q.eq(q.field("hero_id"), args.heroId))
      .collect();

    // Get user information for each comment
    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("_id"), comment.user_id))
          .first();

        return {
          id: comment._id,
          text: comment.text,
          created_by: comment.user_id,
          created_at: comment.created_at,
          user: user
            ? {
                id: user._id,
                name: user.name,
                email: user.email,
                avatarUrl: user.avatarUrl,
              }
            : null,
        };
      })
    );

    return commentsWithUsers;
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

export const deleteHeroComment = mutation({
  args: {
    commentId: v.id("comments"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { commentId, userId } = args;

    // Get the comment
    const comment = await ctx.db.get(commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Check if user is the author of the comment
    if (comment.user_id !== userId) {
      throw new Error("Only the comment author can delete this comment");
    }

    // Delete the comment
    await ctx.db.delete(commentId);

    return { success: true };
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

// Get all thanks given by a specific user
export const getThanksByUser = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const thanks = await ctx.db
      .query("thanks")
      .filter((q) => q.eq(q.field("user_id"), args.userId))
      .collect();

    // Get hero information for each thank
    const thanksWithHeroes = await Promise.all(
      thanks.map(async (thank) => {
        const hero = await ctx.db.get(thank.hero_id);
        return {
          id: thank._id,
          hero_id: thank.hero_id,
          user_id: thank.user_id,
          created_at: thank.created_at,
          hero: hero
            ? {
                id: hero._id,
                full_name: hero.full_name,
                story: hero.story,
                location: hero.location,
                tags: hero.tags,
                photo_url: hero.photo_url,
                created_by: hero.created_by,
                created_at: hero.created_at,
              }
            : null,
        };
      })
    );

    return thanksWithHeroes;
  },
});
