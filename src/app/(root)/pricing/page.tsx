"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useUser } from "@clerk/nextjs";
import { Check, Sparkles } from "lucide-react";
import { getUser } from "@/modules/auth/actions";

type Tier = "FREE" | "PRO" | "ENTERPRISE";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string | undefined;
  amount: number;
  currency: string;
  order_id: string;
  handler: (response: RazorpayResponse) => Promise<void>;
  modal: {
    ondismiss: () => void;
  };
  theme: {
    color: string;
  };
}

export default function PricingPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const [loading, setLoading] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [pendingToast, setPendingToast] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<Tier | null>(null);

  useEffect(() => {
    if (!isPending && pendingToast) {
      toast.success(pendingToast);
      setPendingToast(null);
      setLoading(null);
    }
  }, [isPending, pendingToast]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setCurrentTier(null);
      return;
    }

    let isMounted = true;

    getUser().then((res) => {
      if (isMounted && res.success && res.user?.tier) {
        setCurrentTier(res.user.tier as Tier);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isLoaded, isSignedIn]);

  const isCurrentTier = (tier: Tier) => currentTier === tier;

  const getTierButtonLabel = (tier: Tier, defaultLabel: string) => {
    if (isCurrentTier(tier)) return "Current Plan";
    if (loading === tier) return "Processing...";
    return defaultLabel;
  };

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

          handler: async function (response: RazorpayResponse) {
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

    if (currentTier === tier) {
      toast.info("You are already on this plan");
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
      setCurrentTier(tier as Tier);
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
    <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center px-4 pb-12 pt-10 sm:px-6 lg:px-8">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
      />
      <div className="mb-12 max-w-3xl space-y-4 text-center">
        <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Scale your builds
        </div>
        <h1 className="text-4xl font-semibold tracking-normal md:text-5xl">
          Upgrade Your Plan
        </h1>
        <p className="text-lg leading-8 text-muted-foreground">
          Supercharge your AI workflows with daily token limits. Cancel anytime.
        </p>
      </div>

      <div className="grid w-full max-w-5xl gap-4 md:grid-cols-3">
        {/* FREE TIER / INFO */}
        <div className="flex flex-col rounded-2xl border border-border/70 bg-card/85 p-6 text-card-foreground shadow-sm backdrop-blur">
          <h2 className="text-2xl font-semibold">Starter</h2>
          <div className="mt-3 text-sm text-muted-foreground">
            Included with every new account.
          </div>
          <div className="mt-8">
            <span className="text-5xl font-semibold">₹0</span>
            <span className="text-xl text-muted-foreground">/mo</span>
          </div>
          <ul className="mt-8 flex-1 space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" /> 50 Tokens / day
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" /> Up to 1,500 Tokens / mo
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" /> Basic AI Access
            </li>
          </ul>
          <Button className="mt-8 w-full" variant="outline" disabled={true}>
            {isCurrentTier("FREE") ? "Current Plan" : "Default Plan"}
          </Button>
        </div>

        {/* PRO PACK */}
        <div className="relative flex flex-col rounded-2xl border border-primary/30 bg-primary/10 p-6 text-card-foreground shadow-lg shadow-primary/10 backdrop-blur md:-translate-y-3">
          <div className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            Most Popular
          </div>
          <h2 className="pr-28 text-2xl font-semibold">Pro Tier</h2>
          <div className="mt-3 text-sm text-muted-foreground">
            For serious builders and makers.
          </div>
          <div className="mt-8">
            <span className="text-5xl font-semibold">₹499</span>
            <span className="text-xl text-muted-foreground">/mo</span>
          </div>
          <ul className="mt-8 flex-1 space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" /> 500 Tokens / day
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" /> Up to 7,500 Tokens / mo
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" /> Advanced AI Models
            </li>
          </ul>
          <Button
            className="mt-8 w-full shadow-sm"
            onClick={() => handleUpgrade("PRO")}
            disabled={loading !== null || isCurrentTier("PRO")}
          >
            {getTierButtonLabel("PRO", "Upgrade to Pro")}
          </Button>
        </div>

        {/* ENTERPRISE PACK */}
        <div className="flex flex-col rounded-2xl border border-border/70 bg-card/85 p-6 text-card-foreground shadow-sm backdrop-blur">
          <h2 className="text-2xl font-semibold">Enterprise Tier</h2>
          <div className="mt-3 text-sm text-muted-foreground">
            For heavy usage and scaling teams.
          </div>
          <div className="mt-8">
            <span className="text-5xl font-semibold">₹1499</span>
            <span className="text-xl text-muted-foreground">/mo</span>
          </div>
          <ul className="mt-8 flex-1 space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" /> 2000 Tokens / day
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" /> Up to 30,000 Tokens / mo
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" /> 24/7 Dedicated Support
            </li>
          </ul>
          <Button
            className="mt-8 w-full"
            variant="outline"
            onClick={() => handleUpgrade("ENTERPRISE")}
            disabled={loading !== null || isCurrentTier("ENTERPRISE")}
          >
            {getTierButtonLabel("ENTERPRISE", "Upgrade to Enterprise")}
          </Button>
        </div>
      </div>
    </div>
  );
}
