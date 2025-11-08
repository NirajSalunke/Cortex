// app/api/projects/[projectId]/boards/[boardId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

// ✅ Helper function to log activity
async function logActivity(
  userId: string,
  projectId: string,
  resourceId: string,
  type: "BOARD_CREATED" | "BOARD_UPDATED" | "BOARD_DELETED",
  action: string,
  metadata?: any
) {
  try {
    await prisma.activity.create({
      data: {
        type,
        userId,
        projectId,
        resourceId,
        resourceType: "board",
        action,
        metadata,
      },
    });
  } catch (error) {
    console.error("[ACTIVITY_LOG_ERROR]", error);
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; boardId: string }> }
) {
  const resolvedParams = await params;

  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, boardId } = resolvedParams;

    // ✅ Get user by clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Verify project exists and user has access
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

    // ✅ Fetch board with all cards, assignees, and linked pages
    const board = await prisma.board.findUnique({
      where: { id: boardId, projectId },
      include: {
        cards: {
          orderBy: [{ column: "asc" }, { position: "asc" }],
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
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

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    return NextResponse.json(board);
  } catch (error) {
    console.error("[BOARD_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; boardId: string }> }
) {
  const resolvedParams = await params;

  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, boardId } = resolvedParams;
    const body = await req.json();
    const { name, columns } = body;

    // ✅ Get user
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Verify access to project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const member = project.members.find((m) => m.userId === user.id);
    if (!member) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // ✅ Check permission (EDITOR, ADMIN, or OWNER)
    if (member.role === "VIEWER") {
      return NextResponse.json(
        { error: "Only editors can update boards" },
        { status: 403 }
      );
    }

    // ✅ Verify board exists
    const existingBoard = await prisma.board.findUnique({
      where: { id: boardId, projectId },
    });

    if (!existingBoard) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // ✅ Prepare update data
    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (columns) updateData.columns = columns;

    // ✅ Update board
    const updatedBoard = await prisma.board.update({
      where: { id: boardId, projectId },
      data: updateData,
      include: {
        cards: {
          orderBy: [{ column: "asc" }, { position: "asc" }],
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
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

    // ✅ Log activity
    await logActivity(user.id, projectId, boardId, "BOARD_UPDATED", "updated", {
      updatedFields: Object.keys(updateData),
      boardName: updatedBoard.name,
    });

    return NextResponse.json(updatedBoard);
  } catch (error) {
    console.error("[BOARD_PATCH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; boardId: string }> }
) {
  const resolvedParams = await params;

  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, boardId } = resolvedParams;

    // ✅ Get user
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Verify access to project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const member = project.members.find((m) => m.userId === user.id);
    if (!member) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // ✅ Check permission (only OWNER or ADMIN can delete)
    if (member.role === "VIEWER" || member.role === "EDITOR") {
      return NextResponse.json(
        { error: "Only project owners or admins can delete boards" },
        { status: 403 }
      );
    }

    // ✅ Get board info before deletion
    const board = await prisma.board.findUnique({
      where: { id: boardId, projectId },
    });

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // ✅ Delete board (cascade deletes all cards via Prisma)
    await prisma.board.delete({
      where: { id: boardId, projectId },
    });

    // ✅ Log activity
    await logActivity(user.id, projectId, boardId, "BOARD_DELETED", "deleted", {
      boardName: board.name,
      cardCount:
        (await prisma.kanbanCard.count({
          where: { boardId },
        })) || 0,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[BOARD_DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
