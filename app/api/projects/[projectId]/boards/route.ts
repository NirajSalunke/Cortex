// app/api/projects/[projectId]/boards/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const resolvedParams = await params;

  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = resolvedParams;

    // ✅ Get user by clerkId to get database userId
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      console.log(" ===  user not found ===");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      console.log(" ===  user not found ===");
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isMember = project.members.some((m) => m.userId === user.id);
    if (!isMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const boards = await prisma.board.findMany({
      where: { projectId },
      orderBy: { order: "asc" },
      include: {
        cards: {
          orderBy: { position: "asc" },
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            linkedPage: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(boards);
  } catch (error) {
    console.error("[BOARDS_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    const resolvedParams = await params;

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = resolvedParams;
    const body = await req.json();
    const { name, columns } = body;

    // ✅ Validate input
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Board name is required" },
        { status: 400 }
      );
    }

    // ✅ Get user by clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Verify user has access to this project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isMember = project.members.some((m) => m.userId === user.id);
    if (!isMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // ✅ Check if user is editor or higher
    const member = project.members.find((m) => m.userId === user.id);
    if (member?.role === "VIEWER") {
      return NextResponse.json(
        { error: "Only editors can create boards" },
        { status: 403 }
      );
    }

    // ✅ Get the highest order number for this project
    const lastBoard = await prisma.board.findFirst({
      where: { projectId },
      orderBy: { order: "desc" },
    });

    const newOrder = (lastBoard?.order || 0) + 1;

    // ✅ Generate Liveblocks room ID
    const liveblocksRoomId = `board-${projectId}-${crypto
      .getRandomValues(new Uint8Array(8))
      .join("")}`;

    // ✅ Create the board
    const board = await prisma.board.create({
      data: {
        name: name.trim(),
        projectId,
        liveblocksRoomId, // ✅ Add Liveblocks room ID
        columns: columns || ["To Do", "In Progress", "Done"],
        order: newOrder,
      },
      include: {
        cards: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            linkedPage: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ board }, { status: 201 });
  } catch (error) {
    console.error("[BOARDS_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
