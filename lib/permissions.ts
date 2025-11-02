// lib/permissions.ts

import { ProjectRole } from "@prisma/client";
import { prisma } from "./db";

/**
 * Permission mapping for each role
 * Defines what actions each role can perform
 */
export const ROLE_PERMISSIONS: Record<ProjectRole, string[]> = {
  OWNER: [
    "create",
    "read",
    "update",
    "delete",
    "manage_members",
    "change_roles",
    "manage_settings",
  ],
  ADMIN: ["create", "read", "update", "delete", "manage_members"],
  EDITOR: ["create", "read", "update"],
  VIEWER: ["read"],
};

/**
 * Check if a role has a specific permission
 * @param role - User's role in the project
 * @param permission - Permission to check
 * @returns true if role has permission, false otherwise
 */
export function hasPermission(
  role: ProjectRole | null,
  permission: string
): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role];
  return permissions?.includes(permission) ?? false;
}

/**
 * Get a user's role in a specific project
 * @param userId - User ID from database (not Clerk ID)
 * @param projectId - Project ID
 * @returns User's role or null if not a member
 */
export async function getUserProjectRole(
  userId: string,
  projectId: string
): Promise<ProjectRole | null> {
  try {
    const member = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
      select: {
        role: true,
      },
    });

    return member?.role || null;
  } catch (error) {
    console.error("Error getting user project role:", error);
    return null;
  }
}

/**
 * Check if user can edit (OWNER, ADMIN, EDITOR)
 * @param role - User's role
 * @returns true if user can edit
 */
export function canEdit(role: ProjectRole | null): boolean {
  return hasPermission(role, "update");
}

/**
 * Check if user can delete (OWNER, ADMIN)
 * @param role - User's role
 * @returns true if user can delete
 */
export function canDelete(role: ProjectRole | null): boolean {
  return hasPermission(role, "delete");
}

/**
 * Check if user can create (OWNER, ADMIN, EDITOR)
 * @param role - User's role
 * @returns true if user can create
 */
export function canCreate(role: ProjectRole | null): boolean {
  return hasPermission(role, "create");
}

/**
 * Check if user can manage members (OWNER, ADMIN)
 * @param role - User's role
 * @returns true if user can manage members
 */
export function canManageMembers(role: ProjectRole | null): boolean {
  return hasPermission(role, "manage_members");
}

/**
 * Check if user can change roles (OWNER only)
 * @param role - User's role
 * @returns true if user can change roles
 */
export function canChangeRoles(role: ProjectRole | null): boolean {
  return hasPermission(role, "change_roles");
}

/**
 * Check if user is project owner
 * @param role - User's role
 * @returns true if user is owner
 */
export function isOwner(role: ProjectRole | null): boolean {
  return role === "OWNER";
}

/**
 * Check if user is project admin or owner
 * @param role - User's role
 * @returns true if user is admin or owner
 */
export function isAdmin(role: ProjectRole | null): boolean {
  return role === "OWNER" || role === "ADMIN";
}

/**
 * Check if user has write access
 * @param role - User's role
 * @returns true if user can write
 */
export function hasWriteAccess(role: ProjectRole | null): boolean {
  return ["OWNER", "ADMIN", "EDITOR"].includes(role || "");
}

/**
 * Check if user has read-only access (VIEWER)
 * @param role - User's role
 * @returns true if user has view-only access
 */
export function isViewerOnly(role: ProjectRole | null): boolean {
  return role === "VIEWER";
}

/**
 * Get permission level (0-3, higher = more permissions)
 * @param role - User's role
 * @returns Permission level
 */
export function getPermissionLevel(role: ProjectRole | null): number {
  switch (role) {
    case "OWNER":
      return 3;
    case "ADMIN":
      return 2;
    case "EDITOR":
      return 1;
    case "VIEWER":
      return 0;
    default:
      return -1;
  }
}

/**
 * Check if user can perform action on another user
 * (e.g., changing someone's role or removing them)
 * Only owners/admins can, and only on lower-level roles
 * @param actorRole - Role of person performing action
 * @param targetRole - Role of person being acted upon
 * @returns true if action is allowed
 */
export function canManageUser(
  actorRole: ProjectRole | null,
  targetRole: ProjectRole | null
): boolean {
  if (!canManageMembers(actorRole)) return false;

  // Owners can manage anyone
  if (isOwner(actorRole)) return true;

  // Admins can only manage non-admins and viewers
  if (isAdmin(actorRole)) {
    return !isAdmin(targetRole);
  }

  return false;
}

/**
 * Get all users in a project with their roles
 * @param projectId - Project ID
 * @returns Array of project members with user info
 */
export async function getProjectMembers(projectId: string) {
  try {
    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { role: "desc" }, // Owners first
    });

    return members;
  } catch (error) {
    console.error("Error getting project members:", error);
    return [];
  }
}

/**
 * Check if a user is owner of a specific project
 * @param userId - User ID from database
 * @param projectId - Project ID
 * @returns true if user is owner
 */
export async function isProjectOwner(
  userId: string,
  projectId: string
): Promise<boolean> {
  try {
    const role = await getUserProjectRole(userId, projectId);
    return role === "OWNER";
  } catch (error) {
    console.error("Error checking project owner:", error);
    return false;
  }
}

/**
 * Validate role transition (e.g., can owner make someone admin?)
 * @param fromRole - Current role
 * @param toRole - Desired role
 * @param actorRole - Role of person making the change
 * @returns true if transition is allowed
 */
export function isValidRoleTransition(
  fromRole: ProjectRole,
  toRole: ProjectRole,
  actorRole: ProjectRole | null
): boolean {
  // Can't remove the only owner
  if (fromRole === "OWNER" && toRole !== "OWNER" && actorRole !== "OWNER") {
    return false;
  }

  // Actor must be able to manage users
  if (!canManageUser(actorRole, fromRole)) {
    return false;
  }

  // Actor must be able to manage the target
  if (!canManageUser(actorRole, toRole)) {
    return false;
  }

  return true;
}
