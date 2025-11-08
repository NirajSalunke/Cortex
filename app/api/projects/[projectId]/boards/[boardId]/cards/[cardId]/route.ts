// app/api/projects/[projectId]/boards/[boardId]/cards/[cardId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { ProjectMember } from "@prisma/client";

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ projectId: string; boardId: string; cardId: string }>;
  }
) {
  const resolvedParams = await params;

  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, boardId, cardId } = resolvedParams;

    // ✅ Get user
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Verify access
    const board = await prisma.board.findUnique({
      where: { id: boardId, projectId },
      include: { project: { include: { members: true } } },
    });

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const isMember = board.project.members.some(
      (m: ProjectMember) => m.userId === user.id
    );
    if (!isMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // ✅ Get card
    const card = await prisma.kanbanCard.findUnique({
      where: { id: cardId, boardId },
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
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    return NextResponse.json(card);
  } catch (error) {
    console.error("[CARD_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ projectId: string; boardId: string; cardId: string }>;
  }
) {
  const resolvedParams = await params;
  console.log("                     ---- P                       ");
  console.log("                     ---- A                     ");
  console.log("                     ---- T                       ");
  console.log("                     ---- C                      ");
  console.log("                     ---- H                     ");
  console.log("                     ----                        ");
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, boardId, cardId } = resolvedParams;
    const body = await req.json();
    const { title, description, column, position, assigneeId, dueDate } = body;

    // ✅ Get user
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Verify access
    const board = await prisma.board.findUnique({
      where: { id: boardId, projectId },
      include: { project: { include: { members: true } } },
    });

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const member = board.project.members.find(
      (m: ProjectMember) => m.userId === user.id
    );
    if (!member) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // ✅ Check permission
    if (member.role === "VIEWER") {
      return NextResponse.json(
        { error: "Only editors can update cards" },
        { status: 403 }
      );
    }

    // ✅ Update card
    const card = await prisma.kanbanCard.update({
      where: { id: cardId, boardId },
      data: {
        ...(title && { title: title.trim() }),
        ...(description !== undefined && {
          description: description?.trim() || null,
        }),
        ...(column && { column }),
        ...(position !== undefined && { position }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
        ...(dueDate !== undefined && {
          dueDate: dueDate ? new Date(dueDate) : null,
        }),
      },
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
    });

    return NextResponse.json(card);
  } catch (error) {
    console.error("[CARD_PATCH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ projectId: string; boardId: string; cardId: string }>;
  }
) {
  const resolvedParams = await params;

  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, boardId, cardId } = resolvedParams;

    // ✅ Get user
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Verify access
    const board = await prisma.board.findUnique({
      where: { id: boardId, projectId },
      include: { project: { include: { members: true } } },
    });

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const member = board.project.members.find(
      (m: ProjectMember) => m.userId === user.id
    );
    if (!member) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // ✅ Check permission
    if (member.role === "VIEWER") {
      return NextResponse.json(
        { error: "Only editors can delete cards" },
        { status: 403 }
      );
    }

    // ✅ Delete card
    await prisma.kanbanCard.delete({
      where: { id: cardId, boardId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CARD_DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
