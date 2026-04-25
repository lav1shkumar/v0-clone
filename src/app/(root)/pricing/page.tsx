"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getUser } from "@/modules/auth/actions";
import Script from "next/script";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getUser().then((res) => {
      if (res.success && res.user) {
        setCurrentTier(res.user.tier);
      }
    });
  }, []);

  const handlePayment = (tier: string): Promise<boolean> => {
    return new Promise(async (resolve) => {
      if (currentTier === tier) {
        toast.error("Already on this plan");
        resolve(false);
        return;
      }
      if (!ready || !window.Razorpay) {
        toast.warning("Please wait for the page to load");
        resolve(false);
        return;
      }

      try {
        const res = await fetch("/api/payment/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tier: tier,
          }),
        });

        const data = await res.json();
        if (!data.success) {
          toast.error(data.error || "Failed to create order");
          resolve(false);
          return;
        }

        const order = data.order;

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
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
              resolve(true);
            } else {
              toast.error("Payment verification failed");
              resolve(false);
            }
          },
          modal: {
            ondismiss: function () {
              resolve(false);
            },
          },
          theme: {
            color: "#000000",
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (error) {
        console.error("Payment failed:", error);
        toast.error("Payment initialization failed");
        resolve(false);
      }
    });
  };

  const handleUpgrade = async (tier: string) => {
    setLoading(tier);
    try {
      if (tier === "FREE") {
        const res = await fetch("/api/upgrade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier }),
        });

        if (!res.ok) throw new Error("Failed to downgrade");
        toast.success("Successfully downgraded to Free plan");
      } else {
        const paymentSuccess = await handlePayment(tier);
        if (!paymentSuccess) {
          setLoading(null);
          return;
        }

        const label = tier.charAt(0) + tier.slice(1).toLowerCase();
        toast.success(`Successfully upgraded to ${label}`);
      }

      setCurrentTier(tier);
      window.dispatchEvent(new Event("userUpdated"));
      router.refresh();
    } catch (error) {
      console.error("Upgrade failed:", error);
      toast.error("Failed to update plan");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 w-full max-w-6xl mx-auto">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
      />
      <div className="text-center space-y-4 mb-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Simple, transparent pricing
        </h1>
        <p className="text-xl text-muted-foreground">
          Unlock more tokens to supercharge your AI workflows.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 w-full max-w-5xl">
        {/* FREE TIER */}
        <div className="flex flex-col p-8 bg-card text-card-foreground shadow-lg rounded-xl border">
          <h2 className="text-2xl font-bold">Free</h2>
          <div className="mt-4 text-sm text-muted-foreground">
            Perfect for getting started.
          </div>
          <div className="mt-8">
            <span className="text-5xl font-bold">₹0</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          <ul className="mt-8 space-y-4 flex-1">
            <li className="flex items-center gap-2">✓ 50 Tokens</li>
            <li className="flex items-center gap-2">✓ Basic AI Access</li>
            <li className="flex items-center gap-2">✓ Community Support</li>
          </ul>
          <Button
            className="mt-8 w-full"
            variant="outline"
            onClick={() => {
              if (currentTier !== "FREE") handleUpgrade("FREE");
            }}
            disabled={loading !== null || currentTier === "FREE"}
          >
            {loading === "FREE"
              ? "Updating..."
              : currentTier === "FREE"
                ? "Current plan"
                : "Downgrade to Free"}
          </Button>
        </div>

        {/* PRO TIER */}
        <div className="flex flex-col p-8 bg-black text-white dark:bg-card dark:text-card-foreground shadow-2xl rounded-xl border relative transform md:-translate-y-4">
          <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl uppercase tracking-wider">
            Most Popular
          </div>
          <h2 className="text-2xl font-bold">Pro</h2>
          <div className="mt-4 text-sm opacity-80">
            For serious builders and makers.
          </div>
          <div className="mt-8">
            <span className="text-5xl font-bold">₹999</span>
            <span className="opacity-80">/month</span>
          </div>
          <ul className="mt-8 space-y-4 flex-1">
            <li className="flex items-center gap-2">✓ 250 Tokens</li>
            <li className="flex items-center gap-2">✓ Advanced AI Models</li>
            <li className="flex items-center gap-2">✓ Priority Support</li>
          </ul>
          <Button
            className="mt-8 w-full bg-white text-black hover:bg-zinc-200 dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
            onClick={() => {
              if (currentTier !== "PRO") handleUpgrade("PRO");
            }}
            disabled={loading !== null || currentTier === "PRO"}
          >
            {loading === "PRO"
              ? "Updating..."
              : currentTier === "PRO"
                ? "Current plan"
                : currentTier === "ENTERPRISE"
                  ? "Downgrade to Pro"
                  : "Get Pro"}
          </Button>
        </div>

        {/* ENTERPRISE TIER */}
        <div className="flex flex-col p-8 bg-card text-card-foreground shadow-lg rounded-xl border">
          <h2 className="text-2xl font-bold">Enterprise</h2>
          <div className="mt-4 text-sm text-muted-foreground">
            For teams needing scale.
          </div>
          <div className="mt-8">
            <span className="text-5xl font-bold">₹2999</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          <ul className="mt-8 space-y-4 flex-1">
            <li className="flex items-center gap-2">✓ 1,000 Tokens</li>
            <li className="flex items-center gap-2">✓ Custom APIs</li>
            <li className="flex items-center gap-2">
              ✓ 24/7 Dedicated Support
            </li>
          </ul>
          <Button
            className="mt-8 w-full"
            variant="outline"
            onClick={() => {
              if (currentTier !== "ENTERPRISE") handleUpgrade("ENTERPRISE");
            }}
            disabled={loading !== null || currentTier === "ENTERPRISE"}
          >
            {loading === "ENTERPRISE"
              ? "Updating..."
              : currentTier === "ENTERPRISE"
                ? "Current plan"
                : "Get Enterprise"}
          </Button>
        </div>
      </div>
    </div>
  );
}
