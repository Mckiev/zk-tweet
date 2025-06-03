import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    message: v.string(),
    signature: v.string(),
    ringSize: v.number(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    // TODO: Implement actual signature verification
    const verified = true; // For now, assume all submissions are valid
    
    return await ctx.db.insert("posts", {
      message: args.message,
      signature: args.signature,
      ringSize: args.ringSize,
      timestamp: args.timestamp,
      verified,
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("posts")
      .withIndex("by_timestamp")
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});