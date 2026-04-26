import { NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { auth } from "@clerk/nextjs/server";
import { globalRateLimiter } from "@/lib/rate-limit";
import db from "@/lib/db";
import { flattenTree } from "@/modules/helpers/normalize-tree";
import { streamText } from "ai";
import { SYSTEM_PROMPT } from "@/prompt";
import {
  DEFAULT_MODEL,
  VALID_MODEL_IDS,
  getModelTokenCost,
} from "@/lib/ai-models";
import { TIER_MONTHLY_LIMITS } from "@/lib/utils";

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-real-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0] ??
      "127.0.0.1";

    try {
      await globalRateLimiter.check(10, ip);
    } catch {
      return NextResponse.json(
        { error: "Too Many Requests", code: "TOO_MANY_REQUESTS" },
        { status: 429 },
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    const dbUser = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found", code: "USER_NOT_FOUND" },
        { status: 404 },
      );
    }

    const {
      prompt: userPrompt,
      files,
      model: requestedModel,
    } = await req.json();

    const selectedModel =
      requestedModel && VALID_MODEL_IDS.includes(requestedModel)
        ? requestedModel
        : DEFAULT_MODEL;

    const tokenCost = getModelTokenCost(selectedModel);

    const monthlyLimit = TIER_MONTHLY_LIMITS[dbUser.tier];

    if (dbUser.monthlyTokensUsed + tokenCost > monthlyLimit) {
      return NextResponse.json(
        { error: "Monthly limit reached", code: "OUT_OF_MONTHLY_TOKENS" },
        { status: 402 },
      );
    }

    // Atomic token reservation
    const reserveResult = await db.user.updateMany({
      where: {
        clerkId: userId,
        tokens: { gte: tokenCost },
        monthlyTokensUsed: { lte: monthlyLimit - tokenCost },
      },
      data: {
        tokens: { decrement: tokenCost },
        monthlyTokensUsed: { increment: tokenCost },
      },
    });

    if (reserveResult.count === 0) {
      return NextResponse.json(
        {
          error: "Insufficient tokens or monthly limit reached",
          code: "OUT_OF_TOKENS",
        },
        { status: 402 },
      );
    }

    // console.log(
    //   `Reserved ${tokenCost} tokens (${selectedModel}) for user ${userId}`,
    // );

    const flatFiles = flattenTree(files);
    const messages = `USER REQUEST: ${userPrompt}\n\nCURRENT CODEBASE:\n${JSON.stringify(flatFiles)}`;

    const result = streamText({
      model: google(selectedModel),
      system: SYSTEM_PROMPT,
      prompt: messages,

      onFinish: async ({ finishReason }) => {
        // Refund tokens if the generation failed due to an error, allowing 'length' to be billed
        if (finishReason === "error") {
          try {
            await db.user.update({
              where: { clerkId: userId },
              data: {
                tokens: { increment: tokenCost },
                monthlyTokensUsed: { decrement: tokenCost },
              },
            });
            // console.log(
            //   `Refunded ${tokenCost} tokens (${selectedModel}) to user ${userId} — finishReason: ${finishReason}`,
            // );
          } catch (dbError) {
            console.error(
              "Failed to refund tokens after non-billable stream:",
              dbError,
            );
          }
        }
      },
    });

    const response = result.toTextStreamResponse();
    return new Response(response.body, {
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        "X-Accel-Buffering": "no",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
