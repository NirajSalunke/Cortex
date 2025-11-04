"use client";

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Loader2, Check, X } from "lucide-react";

interface AddMemberDrawerProps {
  projectId: string;
}

export function AddMemberDrawer({ projectId }: AddMemberDrawerProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("EDITOR");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const queryClient = useQueryClient();

  const handleAddMember = async () => {
    if (!email.trim()) {
      setError("Please enter an email");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess(false);

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

      setSuccess(true);
      setEmail("");
      setRole("EDITOR");

      // Refetch members
      queryClient.invalidateQueries({
        queryKey: ["members", projectId],
      });

      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      setError("Something went wrong");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Users className="w-4 h-4" />
          Add Member
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add Team Member</SheetTitle>
          <SheetDescription>
            Invite another user to collaborate on this project
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-6">
          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Address</label>
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
                if (e.key === "Enter") handleAddMember();
              }}
            />
          </div>

          {/* Role Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <Select value={role} onValueChange={setRole} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIEWER">Viewer (Read-only)</SelectItem>
                <SelectItem value="EDITOR">Editor (Edit content)</SelectItem>
                <SelectItem value="ADMIN">Admin (Manage team)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <X className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 rounded-md bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              Member added successfully!
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleAddMember}
            disabled={isLoading || !email.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Member"
            )}
          </Button>

          {/* Info */}
          <p className="text-xs text-gray-600 mt-4">
            • <strong>Viewer:</strong> Can only read documents •{" "}
            <strong>Editor:</strong> Can edit all documents •{" "}
            <strong>Admin:</strong> Can manage team & permissions
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
