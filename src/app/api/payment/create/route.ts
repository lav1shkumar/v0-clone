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
  PRO: 999,
  ENTERPRISE: 2999,
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

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      notes: {
        userId,
        tier,
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
