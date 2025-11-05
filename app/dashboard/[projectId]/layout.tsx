"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

import { AppSidebar1 } from "@/components/app-sidebar";

interface Props {
  children: React.ReactNode;
  params: { projectId: string };
}

export default function DashboardLayout({ children }: Props) {
  return (
    <SidebarProvider>
      <AppSidebar1 variant="floating" collapsible="icon" side="left" />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
