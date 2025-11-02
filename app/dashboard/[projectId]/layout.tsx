"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ProjectSwitcher } from "../components/ProjectSwitcher";
import { PagesList } from "../components/PagesList";
import { Suspense } from "react";
import { AppSidebar1, AppSidebar2 } from "@/components/app-sidebar";

interface Props {
  children: React.ReactNode;
  params: { projectId: string };
}

export default function DashboardLayout({ children }: Props) {
  return (
    <SidebarProvider>
      <AppSidebar1 variant="floating" collapsible="icon" side="left" />
      <SidebarInset>{children}</SidebarInset>
      <AppSidebar2 variant="floating" collapsible="offcanvas" side="right" />
    </SidebarProvider>
  );
}
