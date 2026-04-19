import { updateProjectFiles } from "@/modules/updates";
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

    const { projectId, files } = await req.json();
    const res = await updateProjectFiles(projectId, files, user.id);

    return Response.json(res);
  } catch (error) {
    console.error("Failed to update project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 },
    );
  }
}
