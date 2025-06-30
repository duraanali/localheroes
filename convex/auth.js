"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import CryptoJS from "crypto-js";

// Function to generate a random salt
function generateSalt() {
  return CryptoJS.lib.WordArray.random(16).toString();
}

// Function to hash password with salt
function hashPasswordWithSalt(password, salt) {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: 1000,
  }).toString();
}

// Action to hash password
export const hashPassword = action({
  args: {
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const salt = generateSalt();
    const hashedPassword = hashPasswordWithSalt(args.password, salt);
    return `${salt}:${hashedPassword}`;
  },
});

// Action to verify password
export const verifyPassword = action({
  args: {
    hashedPassword: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const [salt, storedHash] = args.hashedPassword.split(":");
    const computedHash = hashPasswordWithSalt(args.password, salt);
    return storedHash === computedHash;
  },
});

// Action to blacklist a token
export const blacklistToken = action({
  args: {
    token: v.string(),
    userId: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { token, userId, expiresAt } = args;

    // Add token to blacklist using a mutation
    await ctx.runMutation(api.tokenBlacklist.blacklistTokenMutation, {
      token,
      userId,
      expiresAt,
    });

    return { success: true };
  },
});

// Action to check if a token is blacklisted
export const isTokenBlacklisted = action({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const blacklistedToken = await ctx.runQuery(
      api.tokenBlacklist.getBlacklistedToken,
      {
        token: args.token,
      }
    );

    return !!blacklistedToken;
  },
});
