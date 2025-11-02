import { Liveblocks } from "@liveblocks/node";
import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, name: true, email: true, avatar: true },
    });

    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    // Parse room from request body
    const { room } = await request.json();

    // Extract projectId from room ID (format: "project-{projectId}-page-{pageId}")
    const [, projectId] = room.split("-");

    // Check if user has access to this project
    const member = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: user.id,
          projectId,
        },
      },
    });

    if (!member) {
      return new Response("Forbidden", { status: 403 });
    }

    // Create session with role info
    const session = liveblocks.prepareSession(user.id, {
      userInfo: {
        name: user.name || user.email,
        email: user.email,
        avatar: user.avatar,
        role: member.role,
      },
    });

    // Grant permissions based on role
    const canWrite = ["OWNER", "ADMIN", "EDITOR"].includes(member.role);

    if (canWrite) {
      session.allow(room, session.FULL_ACCESS);
    } else {
      session.allow(room, session.READ_ACCESS);
    }

    const { body, status } = await session.authorize();
    return new Response(body, { status });
  } catch (error) {
    console.error("Liveblocks auth error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
