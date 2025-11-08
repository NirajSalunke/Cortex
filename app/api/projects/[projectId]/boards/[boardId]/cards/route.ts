// app/api/projects/[projectId]/boards/[boardId]/cards/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

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

    // ✅ Get user
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      console.log("user notttttttttttt founddddddddddd");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId, projectId },
      include: { project: { include: { members: true } } },
    });

    if (!board) {
      console.log("Boardddddddddddddddd notttttttttttt founddddddddddd");
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const isMember = board.project.members.some((m) => m.userId === user.id);
    if (!isMember) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // ✅ Get all cards for this board
    const cards = await prisma.kanbanCard.findMany({
      where: { boardId },
      orderBy: [{ column: "asc" }, { position: "asc" }],
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

    return NextResponse.json(cards);
  } catch (error) {
    console.error("[CARDS_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
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
    const { title, description, column, position, assigneeId, linkedPageId } =
      body;

    // ✅ Validate input
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Card title is required" },
        { status: 400 }
      );
    }

    if (!column || !column.trim()) {
      return NextResponse.json(
        { error: "Column is required" },
        { status: 400 }
      );
    }

    // ✅ Get user
    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Verify board exists and user has access
    const board = await prisma.board.findUnique({
      where: { id: boardId, projectId },
      include: { project: { include: { members: true } } },
    });

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const member = board.project.members.find((m) => m.userId === user.id);
    if (!member) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // ✅ Check permission (only editors can create cards)
    if (member.role === "VIEWER") {
      return NextResponse.json(
        { error: "Only editors can create cards" },
        { status: 403 }
      );
    }

    // ✅ Get max position in this column
    const maxCard = await prisma.kanbanCard.findFirst({
      where: { boardId, column },
      orderBy: { position: "desc" },
    });

    const newPosition = (maxCard?.position || 0) + 1;

    // ✅ Create card
    const card = await prisma.kanbanCard.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        column,
        position: position ?? newPosition,
        boardId,
        assigneeId: assigneeId || null,
        linkedPageId: linkedPageId || null,
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

    return NextResponse.json(card, { status: 201 });
  } catch (error) {
    console.error("[CARDS_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
