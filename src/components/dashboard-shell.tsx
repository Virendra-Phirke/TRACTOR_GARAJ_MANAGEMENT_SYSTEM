"use client";

import { useTheme } from "@/components/theme-provider";

/**
 * Wraps the entire dashboard layout (sidebar + main).
 * When the theme editor Sheet opens (position: fixed, right: 0),
 * this shell shrinks by adding a matching margin-right so
 * nothing sits behind the Sheet.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { themeEditorOpen } = useTheme();

  return (
    <div
      className="flex h-screen overflow-hidden transition-[margin-right] duration-300 ease-in-out"
      style={{ marginRight: themeEditorOpen ? 380 : 0 }}
    >
      {children}
    </div>
  );
}
