import { prisma } from "@/lib/db";

export async function seedDB() {
  await prisma.activity.deleteMany();
  await prisma.kanbanCard.deleteMany();
  await prisma.board.deleteMany();
  await prisma.page.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  console.log("Database cleaned");

  const user = await prisma.user.create({
    data: {
      clerkId: "user_test_123",
      email: "test@example.com",
      name: "Test User",
      avatar: "https://avatar.example.com/test.jpg",
    },
  });

  console.log("Created user:", user);

  // Create a project
  const project = await prisma.project.create({
    data: {
      name: "Design Engineering",
      description: "Frontend and UI/UX design work",
      icon: "🎨",
      color: "blue",
    },
  });

  console.log("Created project:", project);

  // Add user as owner
  const member = await prisma.projectMember.create({
    data: {
      userId: user.id,
      projectId: project.id,
      role: "OWNER",
    },
  });

  console.log("Added user to project:", member);

  // Create a page
  const page = await prisma.page.create({
    data: {
      title: "Getting Started",
      liveblocksRoomId: `project-${project.id}-page-getting-started`,
      projectId: project.id,
      authorId: user.id,
    },
  });

  console.log("Created page:", page);

  // Create a board
  const board = await prisma.board.create({
    data: {
      name: "Sprint Board",
      projectId: project.id,
      columns: JSON.stringify(["To Do", "In Progress", "Done"]),
    },
  });

  console.log("Created board:", board);

  // Create a card
  const card = await prisma.kanbanCard.create({
    data: {
      title: "Build authentication",
      description: "Implement Clerk authentication",
      column: "In Progress",
      position: 1,
      boardId: board.id,
      assigneeId: user.id,
      labels: JSON.stringify([{ id: "1", name: "feature", color: "blue" }]),
    },
  });

  console.log("Created card:", card);
}
