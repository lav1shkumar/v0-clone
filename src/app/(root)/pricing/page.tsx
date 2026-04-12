"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (tier: string) => {
    setLoading(tier);
    try {
      const res = await fetch("/api/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });

      if (!res.ok) {
        throw new Error("Failed to upgrade");
      }

      toast.success(`Successfully upgraded to ${tier}`);
      router.refresh();
    } catch (error) {
      toast.error("Failed to upgrade tier");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 w-full max-w-6xl mx-auto min-h-screen">
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
            <span className="text-5xl font-bold">$0</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          <ul className="mt-8 space-y-4 flex-1">
            <li className="flex items-center gap-2">✓ 20 Tokens</li>
            <li className="flex items-center gap-2">✓ Basic AI Access</li>
            <li className="flex items-center gap-2">✓ Community Support</li>
          </ul>
          <Button
            className="mt-8 w-full"
            variant="outline"
            onClick={() => handleUpgrade("FREE")}
            disabled={loading !== null}
          >
            {loading === "FREE" ? "Updating..." : "Downgrade to Free"}
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
            <span className="text-5xl font-bold">$15</span>
            <span className="opacity-80">/month</span>
          </div>
          <ul className="mt-8 space-y-4 flex-1">
            <li className="flex items-center gap-2">✓ 250 Tokens</li>
            <li className="flex items-center gap-2">✓ Advanced AI Models</li>
            <li className="flex items-center gap-2">✓ Priority Support</li>
          </ul>
          <Button
            className="mt-8 w-full bg-white text-black hover:bg-zinc-200 dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
            onClick={() => handleUpgrade("PRO")}
            disabled={loading !== null}
          >
            {loading === "PRO" ? "Updating..." : "Get Pro"}
          </Button>
        </div>

        {/* ENTERPRISE TIER */}
        <div className="flex flex-col p-8 bg-card text-card-foreground shadow-lg rounded-xl border">
          <h2 className="text-2xl font-bold">Enterprise</h2>
          <div className="mt-4 text-sm text-muted-foreground">
            For teams needing scale.
          </div>
          <div className="mt-8">
            <span className="text-5xl font-bold">$49</span>
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
            onClick={() => handleUpgrade("ENTERPRISE")}
            disabled={loading !== null}
          >
            {loading === "ENTERPRISE" ? "Updating..." : "Get Enterprise"}
          </Button>
        </div>
      </div>
    </div>
  );
}
