import db from "@/lib/db";
import { getUser } from "@/modules/auth/actions";

export async function GET(req: Request) {
  const { user } = await getUser();

  if (!user?.id) {
    return Response.json({
      success: false,
      message: "User not found",
    });
  }

  const res = await db.user.findUnique({
    where: {
      id: user.id,
    },
    include: {
      projects: {
        take: 25,
        orderBy: {
          updatedAt: "desc",
        },
      },
    },
  });
  return Response.json({ success: true, projects: res?.projects });
}
