import { NextResponse } from "next/server";
import { getUser } from "@/modules/auth/actions";
import db from "@/lib/db";

export async function POST(req: Request) {
    try {
        const { projectId } = await req.json();
        const { user } = await getUser();
        if (!user?.id) {
            return NextResponse.json(
                { error: "Unauthorized", code: "UNAUTHORIZED" },
                { status: 401 },
            );
        }
        const dbUser = await db.user.findUnique({
            where: { id: user.id },
        });
        if (!dbUser) {
            return NextResponse.json(
                { error: "User not found", code: "USER_NOT_FOUND" },
                { status: 404 },
            );
        }
        const res = await db.project.delete({
            where: {
                id: projectId,
                userId: user.id,
            },
        });
        return Response.json({success: true, project: res});
    } catch (error) {
        console.error("Failed to delete project:", error);
        return NextResponse.json(
            { error: "Failed to delete project" },
            { status: 500 },
        );
    }
}