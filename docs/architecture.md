# Cortex Architecture

Cortex is a modern project management and documentation platform that merges **real‑time editing** with **Kanban-based workflow management**. It is designed for teams that need seamless collaboration, clear project structures, multi-project navigation, and rich role-based access control.

---

## Overview

Cortex provides:

- Collaborative rich-text documentation
- Real-time editing with presence indicators and live cursors
- Kanban project boards with drag-and-drop task management
- Multi-project dashboard navigation
- Team and user role management (Owner, Admin, Editor, Viewer)

The system is built with a **full-stack Next.js setup**, backed by **PostgreSQL** via **Prisma**, and powered by **Liveblocks** for real-time syncing.

---

## High-Level Architecture

### 1. Frontend

- **Framework**: Next.js (App Router)
- **UI Libraries**: Shadcn/UI, Radix UI
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **Animation**: GSAP

**Key UI Features:**

- Dashboard with dual-sidebar layout
- Project navigation & workspace switching
- Collaborative docs and Kanban boards
- Theme switching and good mobile responsiveness

---

### 2. Real-Time Collaboration Layer

| Feature            | Technology              | Description                                    |
| ------------------ | ----------------------- | ---------------------------------------------- |
| Document Sync      | **Liveblocks Storage**  | Ensures all users see real-time updates        |
| Presence & Cursors | **Liveblocks Presence** | Shows who is editing and where                 |
| Editor             | **Tiptap**              | Rich-text editor with collaborative extensions |

The editor behaves similarly to Google Docs: multiple users can type, highlight, and format content simultaneously.

---

### 3. Authentication & User Management

- **Auth Provider**: Clerk
- Roles: `OWNER`, `ADMIN`, `EDITOR`, `VIEWER`
- Invite flow handled via UI, and synced to database

User identity comes from Clerk, while project membership and permissions are controlled in the database.

---

### 4. Backend / API Layer

- **API style**: RESTful endpoints via Next.js `/app/api`
- **Persistence**: Prisma ORM

**API responsibilities:**

- Creating and managing projects
- Adding/removing members
- Managing pages (docs)
- Managing board columns/cards
- Writing activity logs

---

### 5. Database

**Engine**: PostgreSQL

**Main Models:**

- **User**: Base identity reference synced with Clerk
- **Project**: User-owned workspaces containing boards & documentation
- **ProjectMember**: Defines a user’s role within a specific project
- **Page**: Rich-text document, tied to Liveblocks for collaborative editing
- **Board**: Represents a Kanban board (stores columns + card references)
- **KanbanCard**: Individual task item
- **Activity**: Detailed timeline of project actions

Schema is managed using Prisma: `/prisma/schema.prisma`.

---

## Directory Structure

```bash
/app
  ├─ /api              # Backend endpoints
  ├─ /dashboard        # Dashboard UI (docs, boards, navigation)
  ├─ globals.css
  ├─ layout.tsx
  └─ provider.tsx      # Liveblocks, theme, state providers

/components
  ├─ CollaborativeEditor.tsx  # Tiptap + Liveblocks editor
  ├─ add-member-drawer.tsx
  ├─ app-sidebar.tsx
  ├─ Navbar
  └─ ui/              # Shadcn components

/hooks
  ├─ useUserSync.ts   # Clerk <-> DB sync
  └─ use-mobile.ts

/lib
  └─ db.ts, permissions.ts, store.ts, user-sync.ts, utils.ts

/prisma
  └─ schema.prisma    # DB models
```

---

## Data Flow Summary

1. User logs in using **Clerk** → app receives identity data.
2. Project roles are retrieved from the DB → determines UI and API access.
3. When editing a page → changes sync instantly via **Liveblocks**.
4. Kanban drag-and-drop → updates API → persists via Prisma → broadcasts updates.
5. All key actions create an **Activity Log**, useful for auditing.

---

## Tech Stack Summary

| Layer    | Technology                                     |
| -------- | ---------------------------------------------- |
| Frontend | Next.js, Shadcn/UI, TailwindCSS, GSAP, Zustand |
| Realtime | Liveblocks, Tiptap                             |
| Auth     | Clerk                                          |
| Backend  | Next.js API Routes, Prisma ORM                 |
| Database | PostgreSQL                                     |

---

## Setup & Development

```bash
git clone https://github.com/NirajSalunke/Cortex.git
cd Cortex
pnpm install
```

Copy environment variables:

```bash
cp .env.example .env.local
```

Initialize DB:

```bash
pnpm db:migrate
pnpm db:seed   # optional
```

Run:

```bash
pnpm dev
```

App runs at: **[http://localhost:3000](http://localhost:3000)**

---

## Extending Cortex

- Add API functionality under `/app/api`
- Add new UI components inside `/components`
- Modify schema in `prisma/schema.prisma` → run migrations
- Apply role-based permissions using `permissions.ts`

---

Cortex is designed to be **modular, collaborative, and extensible**, making it suitable for internal team knowledge spaces, product workspaces, and project documentation workflows.
