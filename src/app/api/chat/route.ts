import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { runChat } from "@/lib/ai/chat";
import { globalRateLimiter } from "@/lib/rate-limit";
import db from "@/lib/db";

export async function POST(req: Request) {
  try {
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor
      ? (forwardedFor.split(",")[0] ?? "127.0.0.1")
      : "127.0.0.1";

    try {
      await globalRateLimiter.check(5, ip);
    } catch {
      return new NextResponse(
        JSON.stringify({
          error: "Too Many Requests",
          code: "TOO_MANY_REQUESTS",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return new NextResponse(
        JSON.stringify({
          error: "Unauthorized",
          code: "UNAUTHORIZED",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!dbUser) {
      return new NextResponse(
        JSON.stringify({
          error: "User not found",
          code: "USER_NOT_FOUND",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    if (dbUser.tokens <= 0) {
      return new NextResponse(
        JSON.stringify({
          error: "Insufficient tokens",
          code: "OUT_OF_TOKENS",
        }),
        { status: 402, headers: { "Content-Type": "application/json" } },
      );
    }

    const { userPrompt, files } = await req.json();

    const result = await runChat(userPrompt, files);

    if (result.status === 200) {
      await db.user.update({
        where: { clerkId: userId },
        data: { tokens: dbUser.tokens - 10 },
      });
    }

    return result;
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(JSON.stringify({ error: "Something went wrong" }), {
      status: 500,
    });
  }
}
