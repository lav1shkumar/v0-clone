import db from "@/lib/db";
import { getUser } from "@/modules/auth/actions";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { user } = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 },
      );
    }
    const { projectId, message, role } = await req.json();

    const project = await db.project.update({
      where: {
        id: projectId,
        userId: user.id
      },
      data: {
        messages: {
          create: {
            content: message,
            role: role,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Failed to add message" }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, message: "Message added successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to add message:", error);
    return NextResponse.json({ error: "Failed to add message" }, { status: 500 });
  }
}
