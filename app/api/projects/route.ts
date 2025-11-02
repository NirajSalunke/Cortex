import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncClerkUserToDB } from "@/lib/user-sync";

// POST: Create new project
export async function POST(request: NextRequest) {
  try {
    // Get user ID from Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clerkUser = await (await clerkClient()).users.getUser(userId);

    // Parse request body
    const body = await request.json();
    const { name, description } = body;

    // Validate inputs
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    if (description && typeof description !== "string") {
      return NextResponse.json(
        { error: "Description must be text" },
        { status: 400 }
      );
    }

    const user = await syncClerkUserToDB(
      userId,
      clerkUser.primaryEmailAddress?.emailAddress || "",
      `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
      clerkUser.imageUrl || undefined
    );

    // Create project
    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        icon: "📁",
        color: "blue",
      },
    });

    // ✅ Use user.id (database ID)
    await prisma.projectMember.create({
      data: {
        userId: user.id,
        projectId: project.id,
        role: "OWNER",
      },
    });

    console.log("✅ Project created:", project.id, "by user:", user.id);

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("❌ Create project error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: Fetch all projects for user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all projects user is member of
    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        members: {
          select: {
            role: true,
            userId: true,
            user: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: { members: true, pages: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("✅ Projects fetched:", projects.length, "for user:", user.id);

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("❌ Fetch projects error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
