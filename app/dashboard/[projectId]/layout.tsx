import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar1 } from "@/components/app-sidebar";
import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  params: { projectId: string };
}

export default function DashboardLayout({ children, params }: LayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar1 variant="floating" collapsible="icon" side="left" />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
