"use client";

import { useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";

export function useUserSync() {
  const { userId, isLoaded } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    if (!isLoaded || !userId || !user) return;

    fetch("/api/user/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clerkId: userId,
        email: user.primaryEmailAddress?.emailAddress || "",
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || null,
        avatar: user.imageUrl || null,
      }),
    }).catch((error) => console.error("Sync failed:", error));
  }, [userId, user, isLoaded]);
}
