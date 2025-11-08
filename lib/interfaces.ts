// interfaces.ts

export type ProjectRole = "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";

export type ActivityType =
  | "PAGE_CREATED"
  | "PAGE_UPDATED"
  | "PAGE_DELETED"
  | "BOARD_CREATED"
  | "BOARD_UPDATED"
  | "BOARD_DELETED"
  | "CARD_CREATED"
  | "CARD_UPDATED"
  | "CARD_MOVED"
  | "CARD_DELETED"
  | "USER_MENTIONED"
  | "USER_ASSIGNED";

// ==================== USER ====================
export interface User {
  id: string;
  clerkId: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
  createdAt: string;
  updatedAt: string;

  // Relations
  projectMembers?: ProjectMember[];
  pages?: Page[];
  kanbanCards?: KanbanCard[];
  activities?: Activity[];
}

// ==================== PROJECT ====================
export interface Project {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  createdAt: string;
  updatedAt: string;
  members?: ProjectMember[];
  pages?: Page[];
  boards?: Board[];
  activities?: Activity[];
}

// ==================== PROJECT MEMBER ====================
export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  role: ProjectRole;
  joinedAt: string;
  user?: User;
  project?: Project;
}

// ==================== PAGE (DOCUMENTATION) ====================
export interface Page {
  id: string;
  title: string;
  liveblocksRoomId: string;
  parentId?: string | null;
  projectId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  project?: Project;
  author?: User;
  parent?: Page | null;
  children?: Page[];
  linkedCards?: KanbanCard[];
}

// ==================== BOARD ====================
export interface Board {
  id: string;
  name: string;
  projectId: string;
  liveblocksRoomId: string;
  columns: string[]; // assuming the JSON is always an array of strings!
  order: number;
  createdAt: string;
  updatedAt: string;
  project?: Project;
  cards?: KanbanCard[];
}

// ==================== KANBAN CARD ====================
export interface KanbanCard {
  id: string;
  title: string;
  description?: string | null;
  column: string;
  position: number;
  labels?: any | null; // JSON: could be array of {id, name, color}
  dueDate?: string | null; // ISO string
  boardId: string;
  assigneeId?: string | null;
  linkedPageId?: string | null;
  createdAt: string;
  updatedAt: string;
  board?: Board;
  assignee?: User | null;
  linkedPage?: Page | null;
}

// ==================== ACTIVITY LOG ====================
export interface Activity {
  id: string;
  type: ActivityType;
  userId: string;
  projectId: string;
  resourceId: string;
  resourceType: string; // "page", "card", or "board"
  action: string; // "created", "updated", "deleted", "moved", etc.
  metadata?: any | null; // JSON
  createdAt: string;
  user?: User;
  project?: Project;
}

// ========== OTHER COMMON/UTILITY TYPES ==========
export type BoardColumn = string;

// If you want strong typing for `labels`, you can use:
export interface KanbanCardLabel {
  id: string;
  name: string;
  color: string;
}
