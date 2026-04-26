import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { auth } from "@clerk/nextjs/server";
import db from "@/lib/db";
import { Tier } from "@prisma/client";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const PRICES = {
  PRO: 499,
  ENTERPRISE: 1499,
};

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { tier } = await req.json();

    if (tier !== "PRO" && tier !== "ENTERPRISE") {
      return NextResponse.json({ success: false, error: "Invalid tier" });
    }

    const amount = PRICES[tier as key_of_PRICES];

    const user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      notes: {
        userId,
        tier,
      },
    });

    await db.payment.create({
      data: {
        razorpayOrderId: order.id,
        amount: amount,
        tier,
        status: "created",
        userId: user.id,
      },
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Payment creation error:", error);
    return NextResponse.json({
      success: false,
      error: "Internal server error",
    });
  }
}

type key_of_PRICES = keyof typeof PRICES;
