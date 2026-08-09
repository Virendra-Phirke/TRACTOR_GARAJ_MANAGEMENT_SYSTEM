import { Sidebar, SidebarProvider } from "@/components/layout/sidebar";
import { GlobalShortcuts } from "@/components/global-shortcuts";
import { ThemeEditor } from "@/components/theme-editor";
import { ThemeEditorSpacer } from "@/components/theme-editor-spacer";

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
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar />
        <main id="main-content" className="flex-1 min-w-0 overflow-auto relative">
          {children}
        </main>
        <ThemeEditorSpacer />
      </div>
      <GlobalShortcuts />
      <ThemeEditor />
    </SidebarProvider>
  );
}
