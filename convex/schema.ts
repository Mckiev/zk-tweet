import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema defines your data model for the database.
// For more information, see https://docs.convex.dev/database/schema
export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
  }).index("by_clerkId", ["clerkId"]),
  
  posts: defineTable({
    message: v.string(),
    signature: v.string(),
    ringSize: v.number(),
    timestamp: v.number(),
    verified: v.boolean(),
  }).index("by_timestamp", ["timestamp"]),
});
