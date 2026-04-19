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
    const { projectId } = await req.json();

    const project = await db.project.findUnique({
      where: {
        id: projectId,
        userId: user.id
      },
      select: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!project) {
        return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ messages: project.messages }, { status: 200 });
  } catch (error) {
    console.error("Failed to get messages:", error);
    return NextResponse.json({ error: "Failed to get messages" }, { status: 500 });
  }
}
