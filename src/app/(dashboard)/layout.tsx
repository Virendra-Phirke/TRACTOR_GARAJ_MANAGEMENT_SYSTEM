import { Sidebar, SidebarProvider } from "@/components/layout/sidebar";
import { GlobalShortcuts } from "@/components/global-shortcuts";
import { ThemeEditor } from "@/components/theme-editor";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-auto">{children}</main>
      </div>
      <GlobalShortcuts />
      <ThemeEditor />
    </SidebarProvider>
  );
}
