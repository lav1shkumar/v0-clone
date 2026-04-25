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

      let tokens = 50;
      if (tier === "PRO") {
        tokens = 250;
      } else if (tier === "ENTERPRISE") {
        tokens = 1000;
      }

      await db.user.update({
        where: { clerkId: userId },
        data: {
          tier: tier as Tier,
          tokens: tokens,
        },
      });

      console.log(`Successfully upgraded user ${userId} to ${tier}`);
      return NextResponse.json({ success: true });
    } else {
      console.log("Payment verification failed: Invalid signature");
      return NextResponse.json({ success: false, error: "Invalid signature" });
    }
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" });
  }
}
