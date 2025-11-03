import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hasPermission, getUserProjectRole } from "@/lib/permissions";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const resolvedParams = await params;
  console.log("📍 Full params:", params);
  console.log("📍 projectId:", resolvedParams.projectId);

  try {
    const { userId } = await auth();
    if (!userId) {
      console.error("Unauthorized access attempt to create page");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      console.log("User not found for clerkId:", userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const role = await getUserProjectRole(user.id, resolvedParams.projectId);
    if (!role || !hasPermission(role, "create")) {
      console.log(
        "Forbidden: User lacks permission to create page in project",
        {
          userId: user.id,
          projectId: resolvedParams.projectId,
          role,
        }
      );
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, parentId } = body;

    const pageId = `page_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const liveblocksRoomId = `project-${resolvedParams.projectId}-page-${pageId}`;

    const page = await prisma.page.create({
      data: {
        title,
        parentId,
        projectId: resolvedParams.projectId,
        authorId: user.id,
        liveblocksRoomId,
      },
    });

    await prisma.activity.create({
      data: {
        type: "PAGE_CREATED",
        userId: user.id,
        projectId: resolvedParams.projectId,
        resourceId: page.id,
        resourceType: "page",
        action: "created",
        metadata: { title },
      },
    });

    return NextResponse.json({ page }, { status: 201 });
  } catch (error) {
    console.error("Create page error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      console.log("User not found for clerkId:", userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const role = await getUserProjectRole(user.id, resolvedParams.projectId);
    if (!role) {
      console.log("Forbidden: User has no role in project", {
        userId: user.id,
        projectId: resolvedParams.projectId,
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const pages = await prisma.page.findMany({
      where: { projectId: resolvedParams.projectId },
      include: {
        author: { select: { id: true, name: true } },
        children: true,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(
      `Fetched ${pages.length} pages for project ${resolvedParams.projectId}`
    );
    return NextResponse.json({ pages, userRole: role });
  } catch (error) {
    console.error("Fetch pages error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
