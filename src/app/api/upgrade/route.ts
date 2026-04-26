import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";
import { Tier } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { tier } = await req.json();

    if (tier !== "FREE") {
      return new NextResponse("Invalid request for this endpoint", {
        status: 400,
      });
    }

    const { TIER_DAILY_LIMITS } = await import("@/lib/utils");

    const now = new Date();
    const updatedUser = await db.user.update({
      where: { clerkId: userId },
      data: {
        tier: tier as Tier,
        tokens: TIER_DAILY_LIMITS.FREE,
        lastTokenRefresh: now,
        monthlyTokensUsed: 0,
        lastMonthlyReset: now,
        planExpiresAt: null, // FREE tier has no expiration
      },
    });

    return NextResponse.json({
      success: true,
      tier: updatedUser.tier,
      tokens: updatedUser.tokens,
    });
  } catch (error) {
    console.error("Upgrade error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
