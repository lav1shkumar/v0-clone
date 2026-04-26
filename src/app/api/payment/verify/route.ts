import crypto from "crypto";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import db from "@/lib/db";
import { Tier } from "@prisma/client";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // Signature is valid, now fetch the order to get the notes (tier and userId)
      const order = await razorpay.orders.fetch(razorpay_order_id);
      const { userId, tier } = order.notes as { userId: string; tier: string };

      if (!userId || !tier) {
        return NextResponse.json({ success: false, error: "Missing metadata" });
      }

      const payment = await db.payment.findUnique({
        where: { razorpayOrderId: razorpay_order_id },
      });

      if (!payment) {
        return NextResponse.json({
          success: false,
          error: "Payment not found",
        });
      }

      if (payment.status === "completed") {
        return NextResponse.json({
          success: true,
          message: "Already processed",
        });
      }

      const { TIER_DAILY_LIMITS } = await import("@/lib/utils");
      let tokens: number = TIER_DAILY_LIMITS.FREE;
      if (tier === "PRO") {
        tokens = TIER_DAILY_LIMITS.PRO;
      } else if (tier === "ENTERPRISE") {
        tokens = TIER_DAILY_LIMITS.ENTERPRISE;
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

      await db.$transaction([
        db.user.update({
          where: { clerkId: userId },
          data: {
            tier: tier as Tier,
            tokens: tokens,
            lastTokenRefresh: now,
            planExpiresAt: expiresAt,
            monthlyTokensUsed: 0,
            lastMonthlyReset: now,
          },
        }),
        db.payment.update({
          where: { id: payment.id },
          data: {
            status: "completed",
            razorpayPaymentId: razorpay_payment_id,
          },
        }),
      ]);

      console.log(`Successfully upgraded user ${userId} to ${tier}`);
      return NextResponse.json({ success: true });
    } else {
      console.log("Payment verification failed: Invalid signature");
      return NextResponse.json({ success: false, error: "Invalid signature" });
    }
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({
      success: false,
      error: "Internal server error",
    });
  }
}
