"use client";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import Script from "next/script";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PayButton() {
  const [ready, setReady] = useState(false);

  const handlePayment = async () => {
    if (!ready || !window.Razorpay) {
      toast.error("Razorpay not loaded yet");
      return;
    }

    const res = await fetch("/api/payment/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: 100,
      }),
    });

    const order = await res.json();

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      order_id: order.id,

      handler: async function (response: any) {
        console.log("PAYMENT SUCCESS:", response);

        const verfiyRes = await fetch("/api/payment/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(response),
        });
        if (verfiyRes.ok) {
          toast.success("Payment success");
        } else {
          toast.error("Payment failed");
        }
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div className="flex justify-center items-center h-[500px]">
      <Button onClick={handlePayment} variant={"outline"}>
        Pay Now
      </Button>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
      />
    </div>
  );
}
