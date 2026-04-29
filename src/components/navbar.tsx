"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { Coins, Moon, Sun, Zap } from "lucide-react";
import { useTheme } from "next-themes";

import { UserButton, Show, SignInButton, SignUpButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

import { getUser } from "@/modules/auth/actions";

const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const [tokens, setTokens] = React.useState<number | null>(null);
  const [tier, setTier] = React.useState<string | null>(null);

  useEffect(() => {
    const fetchUser = () => {
      getUser().then((res) => {
        if (res.success && res.user) {
          setTokens(res.user.tokens);
          setTier(res.user.tier);
        }
      });
    };

    fetchUser();

    window.addEventListener("userUpdated", fetchUser);
    return () => window.removeEventListener("userUpdated", fetchUser);
  }, []);

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border/60 bg-background/75 backdrop-blur-xl transition-colors duration-200">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Image
            src="/logo-light.svg"
            alt="Logo"
            width={42}
            height={42}
            className="block cursor-pointer dark:hidden"
            onClick={() => {
              window.location.href = "/";
            }}
          />
          <Image
            src="/logo-dark.svg"
            alt="Logo"
            width={42}
            height={42}
            className="hidden cursor-pointer dark:block"
            onClick={() => {
              window.location.href = "/";
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="border-border/70 bg-card/70 shadow-sm backdrop-blur"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <Show when="signed-in">
            {tokens !== null && (
              <div className="flex items-center gap-2">
                <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-sm font-medium shadow-sm backdrop-blur sm:flex">
                  <Coins className="h-4 w-4 text-primary" />
                  <span>{tokens}</span>
                  <span className="border-l border-border pl-2 text-xs capitalize text-muted-foreground">
                    {tier}
                  </span>
                </div>
                <Button
                  size="sm"
                  className="gap-1.5 shadow-sm"
                  onClick={() => {
                    window.location.href = "/pricing";
                  }}
                >
                  <Zap className="h-3.5 w-3.5 fill-current" />
                  <span className="hidden sm:inline">Upgrade</span>
                </Button>
              </div>
            )}
            <UserButton />
          </Show>
          <Show when="signed-out">
            <Button
              variant="outline"
              size="sm"
              className="hidden border-border/70 bg-card/70 shadow-sm backdrop-blur sm:inline-flex"
              onClick={() => {
                window.location.href = "/pricing";
              }}
            >
              Pricing
            </Button>
            <SignInButton>
              <Button
                variant="outline"
                size="sm"
                className="border-border/70 bg-card/70 shadow-sm backdrop-blur"
              >
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton>
              <Button size="sm" className="shadow-sm">
                Sign Up
              </Button>
            </SignUpButton>
          </Show>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
