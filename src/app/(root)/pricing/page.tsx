"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useUser } from "@clerk/nextjs";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PricingPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const [loading, setLoading] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [pendingToast, setPendingToast] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && pendingToast) {
      toast.success(pendingToast);
      setPendingToast(null);
      setLoading(null);
    }
  }, [isPending, pendingToast]);

  const handlePayment = async (tier: string): Promise<boolean> => {
    if (!ready || !window.Razorpay) {
      toast.warning("Please wait for the page to load");
      return false;
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
      if (!res.ok || !data?.success) {
        toast.error(data.error || "Failed to create order");
        return false;
      }

      const order = data.order;

      return await new Promise<boolean>((resolve) => {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          order_id: order.id,

          handler: async function (response: any) {
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(response),
            });
            if (verifyRes.ok) {
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
      });
    } catch (error) {
      console.error("Payment failed:", error);
      toast.error("Payment initialization failed");
      return false;
    }
  };

  const handleUpgrade = async (tier: string) => {
    if (isLoaded && !isSignedIn) {
      toast.error("Please sign in to upgrade your plan");
      return;
    }

    setLoading(tier);
    try {
      let successMessage = "";
      if (tier === "FREE") {
        const res = await fetch("/api/upgrade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier }),
        });

        if (!res.ok) throw new Error("Failed to downgrade");
        successMessage = "Successfully downgraded to Free plan";
      } else {
        const paymentSuccess = await handlePayment(tier);
        if (!paymentSuccess) {
          setLoading(null);
          return;
        }

        const label = tier.charAt(0) + tier.slice(1).toLowerCase();
        successMessage = `Successfully upgraded to ${label}`;
      }

      window.dispatchEvent(new Event("userUpdated"));
      setPendingToast(successMessage);
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error("Upgrade failed:", error);
      toast.error("Failed to update plan");
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
          Upgrade Your Plan
        </h1>
        <p className="text-xl text-muted-foreground">
          Supercharge your AI workflows with daily token limits. Cancel anytime.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 w-full max-w-5xl">
        {/* FREE TIER / INFO */}
        <div className="flex flex-col p-8 bg-card text-card-foreground shadow-lg rounded-xl border opacity-80">
          <h2 className="text-2xl font-bold">Starter</h2>
          <div className="mt-4 text-sm text-muted-foreground">
            Included with every new account.
          </div>
          <div className="mt-8">
            <span className="text-5xl font-bold">₹0</span>
            <span className="text-xl text-muted-foreground">/mo</span>
          </div>
          <ul className="mt-8 space-y-4 flex-1">
            <li className="flex items-center gap-2">✓ 50 Tokens / day</li>
            <li className="flex items-center gap-2">
              ✓ Up to 1,500 Tokens / mo
            </li>
            <li className="flex items-center gap-2">✓ Basic AI Access</li>
          </ul>
          <Button className="mt-8 w-full" variant="outline" disabled={true}>
            Default Plan
          </Button>
        </div>

        {/* PRO PACK */}
        <div className="flex flex-col p-8 bg-black text-white dark:bg-card dark:text-card-foreground shadow-2xl rounded-xl border relative transform md:-translate-y-4">
          <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl uppercase tracking-wider">
            Most Popular
          </div>
          <h2 className="text-2xl font-bold">Pro Tier</h2>
          <div className="mt-4 text-sm opacity-80">
            For serious builders and makers.
          </div>
          <div className="mt-8">
            <span className="text-5xl font-bold">₹499</span>
            <span className="text-xl opacity-80">/mo</span>
          </div>
          <ul className="mt-8 space-y-4 flex-1">
            <li className="flex items-center gap-2">✓ 500 Tokens / day</li>
            <li className="flex items-center gap-2">
              ✓ Up to 7,500 Tokens / mo
            </li>
            <li className="flex items-center gap-2">✓ Advanced AI Models</li>
          </ul>
          <Button
            className="mt-8 w-full bg-white text-black hover:bg-zinc-200 dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
            onClick={() => handleUpgrade("PRO")}
            disabled={loading !== null}
          >
            {loading === "PRO" ? "Processing..." : "Upgrade to Pro"}
          </Button>
        </div>

        {/* ENTERPRISE PACK */}
        <div className="flex flex-col p-8 bg-card text-card-foreground shadow-lg rounded-xl border">
          <h2 className="text-2xl font-bold">Enterprise Tier</h2>
          <div className="mt-4 text-sm text-muted-foreground">
            For heavy usage and scaling teams.
          </div>
          <div className="mt-8">
            <span className="text-5xl font-bold">₹1499</span>
            <span className="text-xl text-muted-foreground">/mo</span>
          </div>
          <ul className="mt-8 space-y-4 flex-1">
            <li className="flex items-center gap-2">✓ 2000 Tokens / day</li>
            <li className="flex items-center gap-2">
              ✓ Up to 30,000 Tokens / mo
            </li>
            <li className="flex items-center gap-2">
              ✓ 24/7 Dedicated Support
            </li>
          </ul>
          <Button
            className="mt-8 w-full"
            variant="outline"
            onClick={() => handleUpgrade("ENTERPRISE")}
            disabled={loading !== null}
          >
            {loading === "ENTERPRISE"
              ? "Processing..."
              : "Upgrade to Enterprise"}
          </Button>
        </div>
      </div>
    </div>
  );
}
