import { NextRequest, NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email, role } = await request.json();

  try {
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    const currentMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: currentUser.id,
          projectId,
        },
      },
    });

    console.log(currentMember);
    if (!currentMember || !["OWNER", "ADMIN"].includes(currentMember.role)) {
      return NextResponse.json(
        { error: "You don't have permission to add members" },
        { status: 403 }
      );
    }

    // ✅ Find user to add by email
    const userToAdd = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!userToAdd) {
      return NextResponse.json(
        { error: "User not found with this email" },
        { status: 404 }
      );
    }

    // ✅ Check if already a member
    const existing = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          projectId,
          userId: userToAdd.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "User is already a member of this project" },
        { status: 400 }
      );
    }

    // ✅ Add as member
    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: userToAdd.id,
        role: role || "EDITOR",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    // ✅ Log activity
    await prisma.activity.create({
      data: {
        type: "USER_ASSIGNED",
        userId: currentUser.id,
        projectId,
        resourceId: userToAdd.id,
        resourceType: "user",
        action: "added_as_member",
        metadata: {
          addedUserId: userToAdd.id,
          role: member.role,
        },
      },
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error("Error adding member:", error);
    return NextResponse.json(
      { error: "Failed to add member" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  console.log("\n\n=== 📍 GET MEMBERS ENDPOINT ===\n");

  process.stderr.write("=== TEST STDERR ===\n");

  const { projectId } = await params;
  console.log("✓ Step 1: Extracted params");
  console.log(`  - projectId: ${projectId}\n`);

  const { userId: clerkUserId } = await auth();
  console.log("✓ Step 2: Got Clerk auth");
  console.log(`  - clerkUserId: ${clerkUserId}\n`);

  if (!clerkUserId) {
    console.log("❌ ERROR: No clerkUserId found!\n");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("=== 🔍 FINDING CURRENT USER ===\n");

    const currentUser = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    console.log("✓ Step 3: Queried user by clerkId");
    console.log(`  - currentUser.id: ${currentUser?.id}`);
    console.log(`  - currentUser.email: ${currentUser?.email}`);
    console.log(`  - currentUser.clerkId: ${currentUser?.clerkId}\n`);

    if (!currentUser) {
      console.log("❌ ERROR: User profile not found in DB!");
      console.log(`  - Searched with clerkId: ${clerkUserId}\n`);
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    console.log("=== 🔐 CHECKING PROJECT MEMBERSHIP ===\n");

    const hasMembership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: currentUser.id,
          projectId,
        },
      },
    });

    console.log("✓ Step 4: Checked project membership");
    console.log(`  - hasMembership: ${!!hasMembership}`);
    console.log(`  - membership.id: ${hasMembership?.id}`);
    console.log(`  - membership.role: ${hasMembership?.role}`);
    console.log(`  - membership.joinedAt: ${hasMembership?.joinedAt}\n`);

    if (!hasMembership) {
      console.log("❌ ERROR: User is NOT a member of this project!");
      console.log(`  - userId: ${currentUser.id}`);
      console.log(`  - projectId: ${projectId}\n`);
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    console.log("=== 👥 FETCHING ALL MEMBERS ===\n");

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    console.log("✓ Step 5: Fetched all project members");
    console.log(`  - Total members: ${members.length}`);

    members.forEach((member, index) => {
      console.log(`  [${index + 1}] ${member.user.email} (${member.role})`);
    });

    console.log("\n=== ✅ SUCCESS - MEMBERS FETCHED ===\n");
    console.log(`Total members returned: ${members.length}\n`);

    return NextResponse.json(members);
  } catch (error) {
    console.log("\n=== ❌ ERROR ===\n");
    console.error(
      `Exception: ${error instanceof Error ? error.message : String(error)}`
    );
    if (error instanceof Error) {
      console.error(`Stack: ${error.stack}`);
    }
    console.log("\n");

    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

// ✅ DELETE member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { memberId } = await request.json();

  try {
    // ✅ FIXED: Find by clerkId
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }
    const currentMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: currentUser.id,
          projectId,
        },
      },
    });

    if (!currentMember || !["OWNER", "ADMIN"].includes(currentMember.role)) {
      return NextResponse.json(
        { error: "Only OWNER/ADMIN can remove members" },
        { status: 403 }
      );
    }

    const memberToRemove = await prisma.projectMember.findUnique({
      where: { id: memberId },
    });

    await prisma.activity.create({
      data: {
        type: "USER_ASSIGNED",
        userId: currentUser.id,
        projectId,
        resourceId: memberToRemove?.userId || "",
        resourceType: "user",
        action: "removed_as_member",
      },
    });

    await prisma.projectMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}

// ✅ PATCH to update role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { memberId, role } = await request.json();

  try {
    // ✅ FIXED: Find by clerkId
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    const currentMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: currentUser.id,
          projectId,
        },
      },
    });

    if (!currentMember || currentMember.role !== "OWNER") {
      return NextResponse.json(
        { error: "Only OWNER can update roles" },
        { status: 403 }
      );
    }

    const updated = await prisma.projectMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    await prisma.activity.create({
      data: {
        type: "USER_ASSIGNED",
        userId: currentUser.id,
        projectId,
        resourceId: updated.userId,
        resourceType: "user",
        action: "updated_member_role",
        metadata: { newRole: role },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating member role:", error);
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 }
    );
  }
}
