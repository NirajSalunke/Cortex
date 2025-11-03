import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUserProjectRole } from "@/lib/permissions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; pageId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { projectId, pageId } = resolvedParams;

    console.log("📍 Fetching single page:", { projectId, pageId });

    const { userId } = await auth();
    if (!userId) {
      console.error("Unauthorized: No userId");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      console.error("User not found for clerkId:", userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const role = await getUserProjectRole(user.id, projectId);
    if (!role) {
      console.error("Forbidden: User has no role in project", {
        userId: user.id,
        projectId,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const page = await prisma.page.findUnique({
      where: { id: pageId },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        project: {
          select: { id: true, name: true },
        },
        children: {
          include: {
            author: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!page) {
      console.log("Page not found:", pageId);
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }
    if (page.projectId !== projectId) {
      console.error("Page does not belong to project", {
        pageProjectId: page.projectId,
        requestedProjectId: projectId,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.log("✅ Page fetched successfully:", page.id);

    return NextResponse.json({ page });
  } catch (error) {
    console.error("❌ Fetch page error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; pageId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { projectId, pageId } = resolvedParams;

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const role = await getUserProjectRole(user.id, projectId);
    if (!role) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if page exists and belongs to project
    const page = await prisma.page.findUnique({
      where: { id: pageId },
    });

    if (!page || page.projectId !== projectId) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    await prisma.page.delete({
      where: { id: pageId },
    });

    console.log("✅ Page deleted:", pageId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Delete page error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
