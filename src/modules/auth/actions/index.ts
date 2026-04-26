"use server";

import db from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { TIER_DAILY_LIMITS } from "@/lib/utils";

export const handleSignUp = async () => {
  try {
    const user = await currentUser();

    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    const { id, firstName, lastName, emailAddresses, imageUrl } = user;

    const newUser = await db.user.upsert({
      where: {
        clerkId: id,
      },
      update: {
        name:
          firstName && lastName
            ? `${firstName} ${lastName}`
            : firstName || lastName || null,
        image: imageUrl || null,
        email: emailAddresses[0]?.emailAddress || "",
      },
      create: {
        clerkId: id,
        name:
          firstName && lastName
            ? `${firstName} ${lastName}`
            : firstName || lastName || null,
        image: imageUrl || null,
        email: emailAddresses[0]?.emailAddress || "",
      },
    });

    return {
      success: true,
      message: "User created successfully",
      user: newUser,
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "User not found",
    };
  }
};

export const getUser = async () => {
  try {
    const user = await currentUser();
    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }
    let dbUser = await db.user.findUnique({
      where: {
        clerkId: user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        clerkId: true,
        tier: true,
        tokens: true,
        lastTokenRefresh: true,
        planExpiresAt: true,
        monthlyTokensUsed: true,
        lastMonthlyReset: true,
      },
    });

    if (dbUser) {
      const now = new Date();
      let updates: any = {};
      let needsUpdate = false;
      let currentTier = dbUser.tier;

      // 1. Check if plan has expired
      if (
        dbUser.planExpiresAt &&
        now.getTime() > dbUser.planExpiresAt.getTime()
      ) {
        currentTier = "FREE";
        updates.tier = "FREE";
        updates.planExpiresAt = null;
        updates.monthlyTokensUsed = 0;
        updates.lastMonthlyReset = now;
        updates.tokens = TIER_DAILY_LIMITS.FREE;
        updates.lastTokenRefresh = now;
        needsUpdate = true;
      }

      // 2. Check if 30 days passed since last monthly reset
      if (!needsUpdate) {
        const daysSinceMonthlyReset =
          (now.getTime() - dbUser.lastMonthlyReset.getTime()) /
          (1000 * 60 * 60 * 24);
        if (daysSinceMonthlyReset >= 30) {
          updates.monthlyTokensUsed = 0;
          updates.lastMonthlyReset = now;
          needsUpdate = true;
        }
      }

      // 3. Check if 24 hours passed since last daily refresh
      const lastRefresh = updates.lastTokenRefresh || dbUser.lastTokenRefresh;
      const hoursSinceRefresh =
        (now.getTime() - lastRefresh.getTime()) / (1000 * 60 * 60);

      if (!needsUpdate || !updates.lastTokenRefresh) {
        if (hoursSinceRefresh >= 24) {
          updates.tokens = TIER_DAILY_LIMITS[currentTier];
          updates.lastTokenRefresh = now;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        dbUser = await db.user.update({
          where: { clerkId: user.id },
          data: updates,
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            clerkId: true,
            tier: true,
            tokens: true,
            lastTokenRefresh: true,
            planExpiresAt: true,
            monthlyTokensUsed: true,
            lastMonthlyReset: true,
          },
        });
      }
    }

    return {
      success: true,
      message: "User found successfully",
      user: dbUser,
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: "User not found",
    };
  }
};
