import React from "react";
import { handleSignUp } from "@/modules/auth/actions";
import Navbar from "@/components/navbar";

export const dynamic = "force-dynamic";

const Layout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  await handleSignUp();
  return (
    <main className="min-h-screen overflow-x-hidden">
      <Navbar />
      <div
        className="fixed inset-0 -z-10 h-full w-full bg-background
        bg-[radial-gradient(circle_at_top_left,var(--primary)_0,transparent_28rem),radial-gradient(var(--border)_1px,transparent_1px)]
        bg-size-[auto,24px_24px] opacity-[0.18] dark:opacity-[0.22]"
      />
      <div className="flex-1 w-full pt-20">{children}</div>
    </main>
  );
};

export default Layout;
