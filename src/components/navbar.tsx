"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { UserButton, Show, SignInButton, SignUpButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

import { getUser } from "@/modules/auth/actions";
import Link from "next/link";
import { Coins } from "lucide-react";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const [tokens, setTokens] = React.useState<number | null>(null);
  const [tier, setTier] = React.useState<string | null>(null);

  const router = useRouter();

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
    <nav className="p-4 bg-transparent fixed top-0 left-0 right-0 z-50 transition-all border-b border-transparent duration-200">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image
            src="/logo-light.svg"
            alt="Logo"
            width={50}
            height={50}
            className="block dark:hidden cursor-pointer"
            onClick={() => router.push("/")}
          />
          <Image
            src="/logo-dark.svg"
            alt="Logo"
            width={50}
            height={50}
            className="hidden dark:block cursor-pointer"
            onClick={() => router.push("/")}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <Show when="signed-in">
            {tokens !== null && (
              <div className="flex items-center gap-2 border px-3 py-1.5 rounded-full text-sm font-medium mr-2">
                <Coins className="w-4 h-4 text-yellow-500" />
                <span>{tokens}</span>
                <Link
                  href="/pricing"
                  className="text-xs ml-1 text-muted-foreground hover:text-foreground no-underline capitalize"
                >
                  {tier}
                </Link>
              </div>
            )}
            <UserButton />
          </Show>
          <Show when="signed-out">
            <SignInButton>
              <Button variant="outline">Sign In</Button>
            </SignInButton>
            <SignUpButton>
              <Button>Sign Up</Button>
            </SignUpButton>
          </Show>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
