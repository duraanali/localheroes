import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  heroes: defineTable({
    full_name: v.string(),
    story: v.string(),
    location: v.string(),
    tags: v.array(v.string()),
    photo_url: v.string(),
    created_by: v.id("users"),
    created_at: v.float64(),
  }),

  comments: defineTable({
    hero_id: v.id("heroes"),
    user_id: v.id("users"),
    text: v.string(),
    created_at: v.float64(),
  }),

  thanks: defineTable({
    hero_id: v.id("heroes"),
    user_id: v.id("users"),
    created_at: v.float64(),
  }),
});
