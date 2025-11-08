# Setup Guide (Local Run)

This guide provides step-by-step instructions to get the Cortex collaborative workspace running on your local machine for development.

## 1. Prerequisites

Before you begin, you will need the following installed on your system:

- **Node.js** (v18.0 or higher)
- **pnpm** (This project uses `pnpm` as its package manager)
- **Git**
- **A PostgreSQL Database** (A free cloud-hosted instance from [Neon](https://neon.tech/) or [Vercel Postgres](https://vercel.com/postgres) is highly recommended)

## 2. Clone Repository

First, clone the project repository from GitHub:

```bash
git clone https://github.com/NirajSalunke/Cortex.git ./
```

3. Install Dependencies
   Install all project dependencies using pnpm:

```bash
   pnpm install
```

4. Environment Setup (.env.local)
   This is the most critical step. You must get API keys from three external services: Clerk (for auth), Liveblocks (for real-time collaboration), and PostgreSQL (for your database).

Create a file named .env.local in the root of the project and paste the following template.

Code snippet

```env
# ---------------------------------

# DATABASE (PostgreSQL)

# ---------------------------------

# Get this from Neon, Vercel, or your local DB

DATABASE_URL="postgresql://user:password@host:5432/databasename"

# ---------------------------------

# AUTHENTICATION (Clerk)

# ---------------------------------

# Get these from your Clerk.com project dashboard

NEXT*PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test*...
CLERK*SECRET_KEY=sk_test*...

# Set these to your local development URL

NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"

# ---------------------------------

# REAL-TIME COLLABORATION (Liveblocks)

# ---------------------------------

# Get these from your Liveblocks.io project dashboard

NEXT*PUBLIC_LIVEBLOCKS_PUBLIC_KEY=pk_dev*...
LIVEBLOCKS*SECRET_KEY=sk_dev*...
```

5. Run Database Migrations
   With your .env.local file in place, run the Prisma migration to set up all your database tables:

```bash

pnpm prisma migrate dev
```

Prisma will read your prisma/schema.prisma file and create the User, Project, ProjectMember, Page, Board, KanbanCard, and Activity tables.

Troubleshooting: If you have any issues, the safest command to clear and restart your database is:

```bash

pnpm prisma migrate reset
```

6. Run the Application
   You are now ready to start the development server:

```bash

pnpm dev
```

Open http://localhost:3000 in your browser. You should be redirected to the Clerk sign-in page. After signing in, you will land on your dashboard.
