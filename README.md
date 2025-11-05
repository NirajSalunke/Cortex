# Cortex

Cortex is a modern project management and documentation tool that emphasizes **real-time, rich-text collaboration**, fluid Kanban interaction, intuitive multi-project navigation, and robust team/user management. Built using the latest full-stack technologies, Cortex offers a Google Docs–style editor, collaborative Kanban boards, and a developer-friendly architecture.

---

## 🚀 Features

- **Real-time Collaborative Editing:**  
  Google Docs–like live editor built using Tiptap + Liveblocks for seamless multi-user interactions, with live cursors and presence indicators.

- **Kanban Boards:**  
  Organize tasks visually with dynamic Kanban boards, supporting drag-and-drop status changes.

- **Multi-project Support:**  
  Effortless switching and management of multiple projects via sidebar navigation.

- **Documentation Pages per Project:**  
  Rich-text documentation and notes with hierarchical/nested page structure, linked to projects and tasks.

- **Powerful User & Role Management:**  
  Authentication with Clerk; invite/manage team members with roles: OWNER, ADMIN, EDITOR, VIEWER.

- **Responsive & Modern UI:**  
  Beautiful dashboard with a two-sidebar layout, theme switching, and mobile-responsive design.

---

## 🔧 Tech Stack

- **Frontend:** React, Next.js, Shadcn/UI, TailwindCSS
- **Realtime Collaboration:** Liveblocks, Tiptap
- **Auth:** Clerk
- **Database/Backend:** PostgreSQL, Prisma ORM, RESTful Next.js API routes
- **Other:** Zustand (state management), GSAP (animations), Sonner (notifications), Radix UI, Spline for 3D (in Model), TypeScript  
  _See `package.json` for full dependency list_

---

## 🏗️ Project Structure

/app
/api ← Backend API routes (project, member, liveblocks, etc)
/dashboard ← Main dashboard pages, Kanban & docs UIs
globals.css ← Global styles
layout.tsx ← App layout
provider.tsx ← Context providers (Liveblocks, themes, etc)

/components
CollaborativeEditor.tsx ← Core Tiptap + Liveblocks document editor
add-member-drawer.tsx ← Member invitation UI
app-sidebar.tsx, Navbar, nav-projects.tsx, team-section.tsx
ui/ ← Shadcn/Radix primitives

/hooks
useUserSync.ts, ← Clerk<->DB sync logic
use-mobile.ts

/lib
db.ts ← Prisma instance
permissions.ts, store.ts, user-sync.ts, utils.ts

/prisma
schema.prisma ← Data models: User, Project, ProjectMember, Page, Board, KanbanCard, Activity

/public ← Static files/assets

/pages (Next.js pages directory, migration to /app ongoing)

text

---

## 🗃️ Data Models (Prisma)

- **User:** Clerk-authenticated user, has project memberships & activities
- **Project:** Contains members, pages, Kanban boards
- **ProjectMember:** User’s role/relationship to a project (supports OWNER, ADMIN, EDITOR, VIEWER)
- **Page:** Documentation/note, with Liveblocks Room for real-time editing
- **Board:** Kanban board per project, with columns (JSON) and associated KanbanCards
- **KanbanCard:** Individual tasks/cards, can be assigned, labeled, linked to docs
- **Activity:** Audit trail of changes/events

---

## ⚙️ Setup Instructions

1. **Clone this repo and install dependencies**

   ```
   git clone https://github.com/NirajSalunke/Cortex.git
   cd Cortex
   pnpm install            # or npm install / yarn install
   ```

2. **Set up environment variables**

   - Copy `.env.example` to `.env.local`, set up respective keys for Clerk, PostgreSQL DB, Liveblocks, etc.

3. **Database Initialization**

   ```
   pnpm db:migrate         # prisma migrate dev
   pnpm db:seed            # (optional) seed initial data
   ```

4. **Run the Dev Server**
   ```
   pnpm dev                # or npm run dev / yarn dev / bun dev
   ```
   App should be live at [http://localhost:3000](http://localhost:3000/)  
   Start editing in `app/page.tsx`.

---

## 👥 Contribution Guide

- Fork, branch, and PR model preferred
- Use conventional commit messages (`feat:`, `fix:`, `chore:` etc.)
- Run `pnpm lint` before commits
- All PRs should include description and screenshots/gifs for UI changes

---

## 📄 License

Currently not specified. Add a LICENSE file if open-source distribution is intended.

---

## 📌 Credits & Further Reading

- Built with: [Next.js](https://nextjs.org/), [Tiptap](https://tiptap.dev/), [Liveblocks](https://liveblocks.io/), [Clerk](https://clerk.dev/), [Prisma](https://www.prisma.io/)
- UI powered by: [Shadcn UI](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/)

---

_This README is based on code and commit review as of November 2025. Please reference project files for the latest details._
