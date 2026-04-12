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

    let tokens = 50;
    if (tier === "PRO") {
      tokens = 250;
    } else if (tier === "ENTERPRISE") {
      tokens = 1000;
    }

    const updatedUser = await db.user.update({
      where: { clerkId: userId },
      data: {
        tier: tier as Tier,
        tokens: tokens,
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
