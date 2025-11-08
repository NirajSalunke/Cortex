"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ClerkProvider>
  );
}
