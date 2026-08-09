import { Sidebar, SidebarProvider } from "@/components/layout/sidebar";
import { GlobalShortcuts } from "@/components/global-shortcuts";
import { ThemeEditor } from "@/components/theme-editor";
import { DashboardShell } from "@/components/dashboard-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:text-primary">
        Skip to main content
      </a>
      <DashboardShell>
        <Sidebar />
        <main id="main-content" className="flex-1 min-w-0 overflow-auto relative">
          {children}
        </main>
      </DashboardShell>
      <GlobalShortcuts />
      <ThemeEditor />
    </SidebarProvider>
  );
}
