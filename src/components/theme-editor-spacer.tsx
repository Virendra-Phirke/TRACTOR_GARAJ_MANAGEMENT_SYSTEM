"use client";

import { useTheme } from "@/components/theme-provider";

export function ThemeEditorSpacer() {
  const { themeEditorOpen } = useTheme();

  return (
    <div 
      className="shrink-0 transition-[width] duration-300 ease-in-out"
      style={{
        width: themeEditorOpen ? "var(--theme-editor-width, 380px)" : "0px"
      }}
    />
  );
}
