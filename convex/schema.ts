import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    password: v.string(),
    avatarUrl: v.optional(v.string()),
    created_at: v.number(),
  }).index("by_email", ["email"]),

  heroes: defineTable({
    created_by: v.string(),
    full_name: v.string(),
    story: v.string(),
    location: v.string(),
    tags: v.array(v.string()),
    photo_url: v.optional(v.string()),
    created_at: v.number(),
  })
    .index("by_creator", ["created_by"])
    .index("by_location", ["location"])
    .index("by_tags", ["tags"]),

  thanks: defineTable({
    hero_id: v.string(),
    user_id: v.string(),
    created_at: v.number(),
  })
    .index("by_hero", ["hero_id"])
    .index("by_user", ["user_id"])
    .index("by_hero_and_user", ["hero_id", "user_id"]),

  comments: defineTable({
    hero_id: v.string(),
    user_id: v.string(),
    text: v.string(),
    created_at: v.number(),
  })
    .index("by_hero", ["hero_id"])
    .index("by_user", ["user_id"]),
});
