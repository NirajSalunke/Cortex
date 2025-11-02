import { prisma } from "./db";

export async function syncClerkUserToDB(
  clerkId: string,
  email: string,
  name?: string,
  avatar?: string
) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (existingUser) {
      return existingUser;
    }

    // Create new user if doesn't exist
    const user = await prisma.user.create({
      data: {
        clerkId,
        email,
        name: name || null,
        avatar: avatar || null,
      },
    });

    console.log("✅ User synced to DB:", user.id);
    return user;
  } catch (error) {
    console.error("❌ Error syncing user:", error);
    throw error;
  }
}
