"use client";

import { useTheme } from "@/components/theme-provider";

export function ThemeEditorSpacer() {
  const { themeEditorOpen } = useTheme();

  return (
    <div 
      className={`shrink-0 transition-[width] duration-200 ease-in-out ${
        themeEditorOpen ? "w-[340px] sm:w-[380px]" : "w-0"
      }`} 
    />
  );
}
