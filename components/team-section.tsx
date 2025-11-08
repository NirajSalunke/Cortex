"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { Plus, Loader2 } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useParams } from "next/navigation";

export function TeamSection() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { user: clerkUser } = useUser();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("EDITOR");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const params = useParams();
  const projectId = (params?.projectId as string) || "";

  // Fetch members
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["members", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/members`);
      if (!response.ok) throw new Error("Failed to fetch members");
      return response.json();
    },
  });

  // ✅ Filter out current user
  const otherMembers = members?.filter(
    (member: any) =>
      member.user.email !== clerkUser?.emailAddresses[0]?.emailAddress
  );

  // Add member
  const handleAddMember = async () => {
    if (!email.trim()) {
      setError("Please enter an email");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase(),
          role,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to add member");
        return;
      }

      setEmail("");
      setRole("EDITOR");
      setIsOpen(false);

      queryClient.invalidateQueries({
        queryKey: ["members", projectId],
      });
    } catch (err) {
      setError("Something went wrong");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Remove member
  const handleRemoveMember = async (memberId: string) => {
    try {
      await fetch(`/api/projects/${projectId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });

      queryClient.invalidateQueries({ queryKey: ["members", projectId] });
    } catch (error) {
      console.error("Error removing member:", error);
    }
  };

  // Update role
  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      await fetch(`/api/projects/${projectId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, role: newRole }),
      });

      queryClient.invalidateQueries({ queryKey: ["members", projectId] });
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  return (
    <SidebarGroup>
      <div className="flex items-center justify-between">
        <SidebarGroupLabel>
          Team{" "}
          {otherMembers &&
            otherMembers.length > 0 &&
            `(${otherMembers.length})`}
        </SidebarGroupLabel>
        {!isCollapsed && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Team Member</DialogTitle>
                <DialogDescription>
                  Invite someone to collaborate on this project
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Email Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="teammate@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isLoading) handleAddMember();
                    }}
                  />
                </div>

                {/* Role Select */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Select
                    value={role}
                    onValueChange={setRole}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VIEWER">👁️ Viewer</SelectItem>
                      <SelectItem value="EDITOR">✏️ Editor</SelectItem>
                      <SelectItem value="ADMIN">⚙️ Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Error */}
                {error && <p className="text-sm text-red-600">{error}</p>}

                {/* Submit */}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddMember}
                    disabled={isLoading || !email.trim()}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <SidebarGroupContent>
        <SidebarMenu>
          {membersLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          ) : otherMembers?.length === 0 ? (
            <p className="text-sm text-muted-foreground p-2">
              No Team Members yet
            </p>
          ) : (
            otherMembers?.map((member: any) => (
              <SidebarMenuItem key={member.id}>
                <div className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-sidebar-accent group">
                  {/* Avatar */}
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarImage src={member.user.avatar} />
                    <AvatarFallback className="text-xs">
                      {(member.user.name || member.user.email)
                        .substring(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">
                        {member.user.name || "User"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {member.role}
                      </p>
                    </div>
                  )}

                  {/* Menu */}
                  {!isCollapsed && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                        >
                          •••
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() => handleUpdateRole(member.id, "VIEWER")}
                          disabled={member.role === "VIEWER"}
                        >
                          👁️ Viewer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => handleUpdateRole(member.id, "EDITOR")}
                          disabled={member.role === "EDITOR"}
                        >
                          ✏️ Editor
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => handleUpdateRole(member.id, "ADMIN")}
                          disabled={member.role === "ADMIN"}
                        >
                          ⚙️ Admin
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="w-full text-left px-2 py-1.5 text-xs text-red-600 hover:bg-red-50">
                              Remove
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Remove Member?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {member.user.name} will lose access to this
                                project.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveMember(member.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </SidebarMenuItem>
            ))
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
