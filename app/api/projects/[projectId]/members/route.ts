import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

// ============================================
// HELPER FUNCTION - Get DB user from Clerk ID
// ============================================
async function getCurrentUser(clerkUserId: string) {
  return await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
  });
}

// ============================================
// POST - Add member
// ============================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  console.log("\n\n=== 📍 POST ADD MEMBER ===\n");

  const { projectId } = await params;
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email, role } = await request.json();
  console.log(`Adding member: ${email} with role: ${role}`);

  try {
    // ✅ Get current user from DB
    const currentUser = await getCurrentUser(clerkUserId);
    console.log(`Current user: ${currentUser?.email} (${currentUser?.id})`);

    if (!currentUser) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // ✅ Check if current user is OWNER or ADMIN
    const currentMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: currentUser.id, // ✅ Use DB user ID
          projectId,
        },
      },
    });

    console.log(`Current member role: ${currentMember?.role}`);

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
        userId: currentUser.id, // ✅ Use DB user ID
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

    console.log(`✅ Member added: ${member.user.email}`);
    return NextResponse.json(member);
  } catch (error) {
    console.error("Error adding member:", error);
    return NextResponse.json(
      { error: "Failed to add member" },
      { status: 500 }
    );
  }
}

// ============================================
// GET - Fetch members
// ============================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  console.log("\n\n=== 📍 GET MEMBERS ===\n");

  const { projectId } = await params;
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // ✅ Get current user from DB
    const currentUser = await getCurrentUser(clerkUserId);
    console.log(`Current user: ${currentUser?.email}`);

    if (!currentUser) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // ✅ Check membership
    const hasMembership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: currentUser.id, // ✅ Use DB user ID
          projectId,
        },
      },
    });

    console.log(`Has membership: ${!!hasMembership} (${hasMembership?.role})`);

    if (!hasMembership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // ✅ Fetch all members
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

    console.log(`Total members: ${members.length}`);
    members.forEach((m) => console.log(`  - ${m.user.email} (${m.role})`));
    console.log("✅ SUCCESS\n");

    return NextResponse.json(members);
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE - Remove member
// ============================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  console.log("\n\n=== 📍 DELETE MEMBER ===\n");

  const { projectId } = await params;
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { memberId } = await request.json();

  try {
    // ✅ Get current user from DB
    const currentUser = await getCurrentUser(clerkUserId);

    if (!currentUser) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    const currentMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: currentUser.id, // ✅ Use DB user ID
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

    // ✅ Log activity before deletion
    const memberToRemove = await prisma.projectMember.findUnique({
      where: { id: memberId },
    });

    await prisma.activity.create({
      data: {
        type: "USER_ASSIGNED",
        userId: currentUser.id, // ✅ Use DB user ID
        projectId,
        resourceId: memberToRemove?.userId || "",
        resourceType: "user",
        action: "removed_as_member",
      },
    });

    await prisma.projectMember.delete({
      where: { id: memberId },
    });

    console.log(`✅ Member removed: ${memberId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}

// ============================================
// PATCH - Update member role
// ============================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  console.log("\n\n=== 📍 PATCH UPDATE ROLE ===\n");

  const { projectId } = await params;
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { memberId, role } = await request.json();

  try {
    // ✅ Get current user from DB
    const currentUser = await getCurrentUser(clerkUserId);

    if (!currentUser) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    const currentMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: currentUser.id, // ✅ Use DB user ID
          projectId,
        },
      },
    });

    // ✅ Only OWNER can change roles
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

    // ✅ Log activity
    await prisma.activity.create({
      data: {
        type: "USER_ASSIGNED",
        userId: currentUser.id, // ✅ Use DB user ID
        projectId,
        resourceId: updated.userId,
        resourceType: "user",
        action: "updated_member_role",
        metadata: { newRole: role },
      },
    });

    console.log(`✅ Role updated: ${updated.user.email} → ${role}`);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating member role:", error);
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 }
    );
  }
}
