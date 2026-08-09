"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  fontFamily: string;
  setFontFamily: (family: string) => void;
  fontSize: string;
  setFontSize: (size: string) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  playSound: (type: "success" | "error" | "warning" | "click" | "create" | "delete") => void;
  // Custom theme editor
  customTheme: Record<string, string>;
  setTokenColor: (token: string, value: string) => void;
  resetCustomTheme: () => void;
  importTheme: (theme: Record<string, string>) => void;
  exportTheme: () => Record<string, string>;
  userPreset: Record<string, string> | null;
  saveUserPreset: () => void;
  applyUserPreset: () => void;
  // Theme editor panel open state
  themeEditorOpen: boolean;
  setThemeEditorOpen: (open: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 64 premium color schemes — each is { name, hue, primary (oklch), primaryForeground }
export const COLOR_SCHEMES = [
  // Row 1: Greens
  { name: "Emerald", hex: "#10b981", primary: "oklch(0.648 0.17 160)", hue: 160 },
  { name: "Jade", hex: "#00a86b", primary: "oklch(0.62 0.16 157)", hue: 157 },
  { name: "Mint", hex: "#3eb489", primary: "oklch(0.68 0.14 162)", hue: 162 },
  { name: "Forest", hex: "#228b22", primary: "oklch(0.52 0.16 145)", hue: 145 },
  { name: "Sage", hex: "#77815c", primary: "oklch(0.56 0.06 120)", hue: 120 },
  { name: "Lime", hex: "#84cc16", primary: "oklch(0.75 0.19 130)", hue: 130 },
  { name: "Olive", hex: "#6b8e23", primary: "oklch(0.57 0.12 118)", hue: 118 },
  { name: "Spring", hex: "#00ff7f", primary: "oklch(0.85 0.22 155)", hue: 155 },
  // Row 2: Blues
  { name: "Ocean", hex: "#2563eb", primary: "oklch(0.55 0.22 260)", hue: 260 },
  { name: "Sky", hex: "#0ea5e9", primary: "oklch(0.65 0.18 230)", hue: 230 },
  { name: "Azure", hex: "#0078d7", primary: "oklch(0.56 0.19 250)", hue: 250 },
  { name: "Cobalt", hex: "#0047ab", primary: "oklch(0.42 0.18 260)", hue: 260 },
  { name: "Steel", hex: "#4682b4", primary: "oklch(0.58 0.1 240)", hue: 240 },
  { name: "Navy", hex: "#000080", primary: "oklch(0.3 0.17 265)", hue: 265 },
  { name: "Ice", hex: "#73c2fb", primary: "oklch(0.76 0.12 230)", hue: 230 },
  { name: "Denim", hex: "#1560bd", primary: "oklch(0.48 0.18 255)", hue: 255 },
  // Row 3: Purples
  { name: "Violet", hex: "#8b5cf6", primary: "oklch(0.55 0.22 290)", hue: 290 },
  { name: "Amethyst", hex: "#9966cc", primary: "oklch(0.58 0.16 295)", hue: 295 },
  { name: "Plum", hex: "#9b30ff", primary: "oklch(0.52 0.26 300)", hue: 300 },
  { name: "Grape", hex: "#6f42c1", primary: "oklch(0.47 0.2 290)", hue: 290 },
  { name: "Orchid", hex: "#da70d6", primary: "oklch(0.68 0.18 320)", hue: 320 },
  { name: "Mauve", hex: "#e0b0ff", primary: "oklch(0.8 0.12 310)", hue: 310 },
  { name: "Indigo", hex: "#4b0082", primary: "oklch(0.35 0.22 300)", hue: 300 },
  { name: "Heather", hex: "#b7a4db", primary: "oklch(0.72 0.1 290)", hue: 290 },
  // Row 4: Reds & Pinks
  { name: "Ruby", hex: "#e11d48", primary: "oklch(0.55 0.24 15)", hue: 15 },
  { name: "Rose", hex: "#f43f5e", primary: "oklch(0.62 0.22 10)", hue: 10 },
  { name: "Crimson", hex: "#dc143c", primary: "oklch(0.52 0.23 20)", hue: 20 },
  { name: "Cherry", hex: "#de3163", primary: "oklch(0.55 0.22 350)", hue: 350 },
  { name: "Coral", hex: "#ff6f61", primary: "oklch(0.68 0.18 25)", hue: 25 },
  { name: "Blush", hex: "#de5d83", primary: "oklch(0.6 0.17 350)", hue: 350 },
  { name: "Magenta", hex: "#ff00ff", primary: "oklch(0.6 0.3 330)", hue: 330 },
  { name: "Fuchsia", hex: "#d946ef", primary: "oklch(0.6 0.26 325)", hue: 325 },
  // Row 5: Oranges & Yellows
  { name: "Amber", hex: "#f59e0b", primary: "oklch(0.74 0.17 75)", hue: 75 },
  { name: "Tangerine", hex: "#ff9966", primary: "oklch(0.76 0.14 55)", hue: 55 },
  { name: "Sunset", hex: "#fa8072", primary: "oklch(0.7 0.14 35)", hue: 35 },
  { name: "Peach", hex: "#ffcba4", primary: "oklch(0.85 0.08 60)", hue: 60 },
  { name: "Gold", hex: "#ffd700", primary: "oklch(0.87 0.17 90)", hue: 90 },
  { name: "Honey", hex: "#eb9605", primary: "oklch(0.72 0.17 80)", hue: 80 },
  { name: "Copper", hex: "#b87333", primary: "oklch(0.6 0.12 65)", hue: 65 },
  { name: "Bronze", hex: "#cd7f32", primary: "oklch(0.63 0.13 70)", hue: 70 },
  // Row 6: Teals & Cyans
  { name: "Teal", hex: "#14b8a6", primary: "oklch(0.65 0.15 180)", hue: 180 },
  { name: "Aqua", hex: "#00d4aa", primary: "oklch(0.75 0.17 170)", hue: 170 },
  { name: "Cyan", hex: "#06b6d4", primary: "oklch(0.68 0.15 200)", hue: 200 },
  { name: "Turquoise", hex: "#40e0d0", primary: "oklch(0.8 0.13 185)", hue: 185 },
  { name: "Seafoam", hex: "#71d9a2", primary: "oklch(0.8 0.12 165)", hue: 165 },
  { name: "Pine", hex: "#01796f", primary: "oklch(0.48 0.1 175)", hue: 175 },
  { name: "Arctic", hex: "#82cdd6", primary: "oklch(0.78 0.08 200)", hue: 200 },
  { name: "Lagoon", hex: "#5cb8b2", primary: "oklch(0.7 0.1 180)", hue: 180 },
  // Row 7: Neutrals & Darks
  { name: "Slate", hex: "#64748b", primary: "oklch(0.55 0.04 250)", hue: 250 },
  { name: "Zinc", hex: "#71717a", primary: "oklch(0.55 0.02 270)", hue: 270 },
  { name: "Stone", hex: "#78716c", primary: "oklch(0.55 0.02 50)", hue: 50 },
  { name: "Graphite", hex: "#383838", primary: "oklch(0.35 0.01 260)", hue: 260 },
  { name: "Iron", hex: "#48494b", primary: "oklch(0.4 0.01 260)", hue: 260 },
  { name: "Charcoal", hex: "#36454f", primary: "oklch(0.38 0.02 240)", hue: 240 },
  { name: "Ash", hex: "#b2beb5", primary: "oklch(0.75 0.02 160)", hue: 160 },
  { name: "Silver", hex: "#c0c0c0", primary: "oklch(0.78 0.01 260)", hue: 260 },
  // Row 8: Warm & Exotic
  { name: "Cinnamon", hex: "#d2691e", primary: "oklch(0.58 0.15 55)", hue: 55 },
  { name: "Mocha", hex: "#967969", primary: "oklch(0.56 0.06 55)", hue: 55 },
  { name: "Sienna", hex: "#a0522d", primary: "oklch(0.5 0.12 50)", hue: 50 },
  { name: "Burgundy", hex: "#800020", primary: "oklch(0.35 0.16 15)", hue: 15 },
  { name: "Wine", hex: "#722f37", primary: "oklch(0.38 0.1 15)", hue: 15 },
  { name: "Mahogany", hex: "#c04000", primary: "oklch(0.5 0.18 35)", hue: 35 },
  { name: "Terracotta", hex: "#e2725b", primary: "oklch(0.65 0.14 30)", hue: 30 },
  { name: "Clay", hex: "#b66a50", primary: "oklch(0.58 0.1 40)", hue: 40 },
];

// All editable CSS tokens with their default dark-mode values
export const THEME_TOKENS: { token: string; label: string; group: string; defaultDark: string; defaultLight: string }[] = [
  // Base
  { token: "--background", label: "Background", group: "Base", defaultDark: "oklch(0.18 0 0)", defaultLight: "oklch(0.97 0.003 260)" },
  { token: "--foreground", label: "Foreground", group: "Base", defaultDark: "oklch(0.98 0 0)", defaultLight: "oklch(0.15 0.01 260)" },
  // Cards
  { token: "--card", label: "Card Background", group: "Cards", defaultDark: "oklch(0.22 0 0)", defaultLight: "oklch(1 0 0)" },
  { token: "--card-foreground", label: "Card Text", group: "Cards", defaultDark: "oklch(0.98 0 0)", defaultLight: "oklch(0.15 0.01 260)" },
  // Popovers
  { token: "--popover", label: "Popover Background", group: "Popovers", defaultDark: "oklch(0.22 0 0)", defaultLight: "oklch(1 0 0)" },
  { token: "--popover-foreground", label: "Popover Text", group: "Popovers", defaultDark: "oklch(0.98 0 0)", defaultLight: "oklch(0.15 0.01 260)" },
  // Primary
  { token: "--primary", label: "Primary (Buttons/Active)", group: "Primary", defaultDark: "oklch(0.648 0.17 160)", defaultLight: "oklch(0.648 0.17 160)" },
  { token: "--primary-foreground", label: "Primary Text (Buttons)", group: "Primary", defaultDark: "oklch(0.98 0 0)", defaultLight: "oklch(0.98 0 0)" },
  // Secondary
  { token: "--secondary", label: "Secondary (Buttons/Badges)", group: "Secondary", defaultDark: "oklch(0.28 0 0)", defaultLight: "oklch(0.96 0.01 260)" },
  { token: "--secondary-foreground", label: "Secondary Text", group: "Secondary", defaultDark: "oklch(0.98 0 0)", defaultLight: "oklch(0.2 0.01 260)" },
  // Muted
  { token: "--muted", label: "Muted Background (Tabs)", group: "Muted", defaultDark: "oklch(0.28 0 0)", defaultLight: "oklch(0.93 0.006 260)" },
  { token: "--muted-foreground", label: "Muted Text (Subtitles)", group: "Muted", defaultDark: "oklch(0.70 0 0)", defaultLight: "oklch(0.46 0.015 260)" },
  // Accent
  { token: "--accent", label: "Accent (Hover states)", group: "Accent", defaultDark: "oklch(0.28 0 0)", defaultLight: "oklch(0.93 0.006 260)" },
  { token: "--accent-foreground", label: "Accent Text", group: "Accent", defaultDark: "oklch(0.98 0 0)", defaultLight: "oklch(0.15 0.01 260)" },
  // Destructive
  { token: "--destructive", label: "Destructive (Danger Buttons)", group: "Destructive", defaultDark: "oklch(0.62 0.22 25)", defaultLight: "oklch(0.58 0.22 25)" },
  { token: "--destructive-foreground", label: "Destructive Text", group: "Destructive", defaultDark: "oklch(0.98 0 0)", defaultLight: "oklch(0.98 0 0)" },
  // Borders & Inputs
  { token: "--border", label: "Border", group: "Borders & Inputs", defaultDark: "oklch(0.35 0 0)", defaultLight: "oklch(0.88 0.008 260)" },
  { token: "--input", label: "Input Border", group: "Borders & Inputs", defaultDark: "oklch(0.35 0 0)", defaultLight: "oklch(0.9 0.008 260)" },
  { token: "--ring", label: "Focus Ring", group: "Borders & Inputs", defaultDark: "oklch(0.648 0.17 160)", defaultLight: "oklch(0.648 0.17 160)" },
  // Sidebar
  { token: "--sidebar", label: "Sidebar Background", group: "Sidebar", defaultDark: "oklch(0.20 0 0)", defaultLight: "oklch(0.98 0.003 260)" },
  { token: "--sidebar-foreground", label: "Sidebar Text", group: "Sidebar", defaultDark: "oklch(0.98 0 0)", defaultLight: "oklch(0.2 0.01 260)" },
  { token: "--sidebar-primary", label: "Sidebar Primary", group: "Sidebar", defaultDark: "oklch(0.648 0.17 160)", defaultLight: "oklch(0.648 0.17 160)" },
  { token: "--sidebar-primary-foreground", label: "Sidebar Primary Text", group: "Sidebar", defaultDark: "oklch(0.13 0.02 160)", defaultLight: "oklch(0.98 0.005 160)" },
  { token: "--sidebar-accent", label: "Sidebar Accent", group: "Sidebar", defaultDark: "oklch(0.28 0 0)", defaultLight: "oklch(0.94 0.006 260)" },
  { token: "--sidebar-accent-foreground", label: "Sidebar Accent Text", group: "Sidebar", defaultDark: "oklch(0.98 0 0)", defaultLight: "oklch(0.15 0.01 260)" },
  { token: "--sidebar-border", label: "Sidebar Border", group: "Sidebar", defaultDark: "oklch(0.35 0 0)", defaultLight: "oklch(0.9 0.006 260)" },
  { token: "--sidebar-ring", label: "Sidebar Ring", group: "Sidebar", defaultDark: "oklch(0.648 0.17 160)", defaultLight: "oklch(0.648 0.17 160)" },
  // Charts
  { token: "--chart-1", label: "Chart Color 1", group: "Charts", defaultDark: "oklch(0.648 0.17 160)", defaultLight: "oklch(0.648 0.17 160)" },
  { token: "--chart-2", label: "Chart Color 2", group: "Charts", defaultDark: "oklch(0.6 0.18 250)", defaultLight: "oklch(0.55 0.18 250)" },
  { token: "--chart-3", label: "Chart Color 3", group: "Charts", defaultDark: "oklch(0.7 0.15 50)", defaultLight: "oklch(0.65 0.15 50)" },
  { token: "--chart-4", label: "Chart Color 4", group: "Charts", defaultDark: "oklch(0.65 0.2 300)", defaultLight: "oklch(0.6 0.2 300)" },
  { token: "--chart-5", label: "Chart Color 5", group: "Charts", defaultDark: "oklch(0.55 0.15 200)", defaultLight: "oklch(0.5 0.15 200)" },
];

// Quick preset themes
export const THEME_PRESETS: { name: string; emoji: string; overrides: Record<string, string> }[] = [
  {
    name: "Ocean Blue",
    emoji: "🔵",
    overrides: {
      "--background": "#0f172a", "--foreground": "#e2e8f0",
      "--card": "#1e293b", "--card-foreground": "#e2e8f0",
      "--popover": "#1e293b", "--popover-foreground": "#e2e8f0",
      "--primary": "#3b82f6", "--primary-foreground": "#ffffff",
      "--secondary": "#334155", "--secondary-foreground": "#e2e8f0",
      "--muted": "#334155", "--muted-foreground": "#94a3b8",
      "--accent": "#1e40af", "--accent-foreground": "#e2e8f0",
      "--destructive": "#ef4444",
      "--border": "#334155", "--input": "#334155", "--ring": "#3b82f6",
      "--sidebar": "#0f172a", "--sidebar-foreground": "#e2e8f0",
      "--sidebar-primary": "#3b82f6", "--sidebar-border": "#1e293b",
      "--sidebar-accent": "#1e293b", "--sidebar-accent-foreground": "#e2e8f0",
      "--sidebar-ring": "#3b82f6",
      "--chart-1": "#3b82f6", "--chart-2": "#06b6d4", "--chart-3": "#8b5cf6",
      "--chart-4": "#6366f1", "--chart-5": "#3b82f6",
    },
  },
  {
    name: "Purple Haze",
    emoji: "🟣",
    overrides: {
      "--background": "#13111c", "--foreground": "#ede9fe",
      "--card": "#1c1929", "--card-foreground": "#ede9fe",
      "--popover": "#1c1929", "--popover-foreground": "#ede9fe",
      "--primary": "#8b5cf6", "--primary-foreground": "#ffffff",
      "--secondary": "#2e2641", "--secondary-foreground": "#ede9fe",
      "--muted": "#2e2641", "--muted-foreground": "#a78bfa",
      "--accent": "#3b2667", "--accent-foreground": "#ede9fe",
      "--destructive": "#f43f5e",
      "--border": "#2e2641", "--input": "#2e2641", "--ring": "#8b5cf6",
      "--sidebar": "#110f1a", "--sidebar-foreground": "#ede9fe",
      "--sidebar-primary": "#8b5cf6", "--sidebar-border": "#2e2641",
      "--sidebar-accent": "#2e2641", "--sidebar-accent-foreground": "#ede9fe",
      "--sidebar-ring": "#8b5cf6",
      "--chart-1": "#8b5cf6", "--chart-2": "#d946ef", "--chart-3": "#6366f1",
      "--chart-4": "#a855f7", "--chart-5": "#8b5cf6",
    },
  },
  {
    name: "Warm Sunset",
    emoji: "🌅",
    overrides: {
      "--background": "#1c1210", "--foreground": "#fde8e0",
      "--card": "#2a1a16", "--card-foreground": "#fde8e0",
      "--popover": "#2a1a16", "--popover-foreground": "#fde8e0",
      "--primary": "#f97316", "--primary-foreground": "#ffffff",
      "--secondary": "#3d2419", "--secondary-foreground": "#fde8e0",
      "--muted": "#3d2419", "--muted-foreground": "#d4967e",
      "--accent": "#9a3412", "--accent-foreground": "#fde8e0",
      "--destructive": "#dc2626",
      "--border": "#4a2e20", "--input": "#4a2e20", "--ring": "#f97316",
      "--sidebar": "#18100e", "--sidebar-foreground": "#fde8e0",
      "--sidebar-primary": "#f97316", "--sidebar-border": "#3d2419",
      "--sidebar-accent": "#3d2419", "--sidebar-accent-foreground": "#fde8e0",
      "--sidebar-ring": "#f97316",
      "--chart-1": "#f97316", "--chart-2": "#eab308", "--chart-3": "#ef4444",
      "--chart-4": "#fb923c", "--chart-5": "#f97316",
    },
  },
  {
    name: "Monochrome",
    emoji: "🖤",
    overrides: {
      "--background": "#111111", "--foreground": "#e5e5e5",
      "--card": "#1a1a1a", "--card-foreground": "#e5e5e5",
      "--popover": "#1a1a1a", "--popover-foreground": "#e5e5e5",
      "--primary": "#a3a3a3", "--primary-foreground": "#111111",
      "--secondary": "#262626", "--secondary-foreground": "#e5e5e5",
      "--muted": "#262626", "--muted-foreground": "#737373",
      "--accent": "#333333", "--accent-foreground": "#e5e5e5",
      "--destructive": "#b91c1c",
      "--border": "#333333", "--input": "#333333", "--ring": "#a3a3a3",
      "--sidebar": "#0d0d0d", "--sidebar-foreground": "#e5e5e5",
      "--sidebar-primary": "#a3a3a3", "--sidebar-border": "#262626",
      "--sidebar-accent": "#262626", "--sidebar-accent-foreground": "#e5e5e5",
      "--sidebar-ring": "#a3a3a3",
      "--chart-1": "#a3a3a3", "--chart-2": "#737373", "--chart-3": "#d4d4d4",
      "--chart-4": "#525252", "--chart-5": "#a3a3a3",
    },
  },
  {
    name: "Forest Green",
    emoji: "🌿",
    overrides: {
      "--background": "#0f1a14", "--foreground": "#d1e7dd",
      "--card": "#162a1f", "--card-foreground": "#d1e7dd",
      "--popover": "#162a1f", "--popover-foreground": "#d1e7dd",
      "--primary": "#22c55e", "--primary-foreground": "#052e16",
      "--secondary": "#1e3a29", "--secondary-foreground": "#d1e7dd",
      "--muted": "#1e3a29", "--muted-foreground": "#6ee7a0",
      "--accent": "#15803d", "--accent-foreground": "#d1e7dd",
      "--destructive": "#dc2626",
      "--border": "#264d35", "--input": "#264d35", "--ring": "#22c55e",
      "--sidebar": "#0a1410", "--sidebar-foreground": "#d1e7dd",
      "--sidebar-primary": "#22c55e", "--sidebar-border": "#1e3a29",
      "--sidebar-accent": "#1e3a29", "--sidebar-accent-foreground": "#d1e7dd",
      "--sidebar-ring": "#22c55e",
      "--chart-1": "#22c55e", "--chart-2": "#14b8a6", "--chart-3": "#84cc16",
      "--chart-4": "#10b981", "--chart-5": "#22c55e",
    },
  },
  {
    name: "Wine Dark",
    emoji: "🍷",
    overrides: {
      "--background": "#1a0f13", "--foreground": "#f0d5de",
      "--card": "#26131c", "--card-foreground": "#f0d5de",
      "--popover": "#26131c", "--popover-foreground": "#f0d5de",
      "--primary": "#e11d48", "--primary-foreground": "#ffffff",
      "--secondary": "#3a1d2a", "--secondary-foreground": "#f0d5de",
      "--muted": "#3a1d2a", "--muted-foreground": "#fb7185",
      "--accent": "#9f1239", "--accent-foreground": "#f0d5de",
      "--destructive": "#dc2626",
      "--border": "#4c2637", "--input": "#4c2637", "--ring": "#e11d48",
      "--sidebar": "#140a0f", "--sidebar-foreground": "#f0d5de",
      "--sidebar-primary": "#e11d48", "--sidebar-border": "#3a1d2a",
      "--sidebar-accent": "#3a1d2a", "--sidebar-accent-foreground": "#f0d5de",
      "--sidebar-ring": "#e11d48",
      "--chart-1": "#e11d48", "--chart-2": "#f43f5e", "--chart-3": "#be123c",
      "--chart-4": "#fb7185", "--chart-5": "#e11d48",
    },
  },
  {
    name: "Cyber Neon",
    emoji: "⚡",
    overrides: {
      "--background": "#0a0a0f", "--foreground": "#e0f2fe",
      "--card": "#111118", "--card-foreground": "#e0f2fe",
      "--popover": "#111118", "--popover-foreground": "#e0f2fe",
      "--primary": "#06b6d4", "--primary-foreground": "#000000",
      "--secondary": "#1a1a28", "--secondary-foreground": "#e0f2fe",
      "--muted": "#1a1a28", "--muted-foreground": "#67e8f9",
      "--accent": "#164e63", "--accent-foreground": "#e0f2fe",
      "--destructive": "#f43f5e",
      "--border": "#1e293b", "--input": "#1e293b", "--ring": "#06b6d4",
      "--sidebar": "#070710", "--sidebar-foreground": "#e0f2fe",
      "--sidebar-primary": "#06b6d4", "--sidebar-border": "#1a1a28",
      "--sidebar-accent": "#1a1a28", "--sidebar-accent-foreground": "#e0f2fe",
      "--sidebar-ring": "#06b6d4",
      "--chart-1": "#06b6d4", "--chart-2": "#a855f7", "--chart-3": "#22d3ee",
      "--chart-4": "#ec4899", "--chart-5": "#06b6d4",
    },
  },
  {
    name: "Rose Gold",
    emoji: "🌸",
    overrides: {
      "--background": "#1a1315", "--foreground": "#fce7f3",
      "--card": "#261a1f", "--card-foreground": "#fce7f3",
      "--popover": "#261a1f", "--popover-foreground": "#fce7f3",
      "--primary": "#ec4899", "--primary-foreground": "#ffffff",
      "--secondary": "#3b202c", "--secondary-foreground": "#fce7f3",
      "--muted": "#3b202c", "--muted-foreground": "#f9a8d4",
      "--accent": "#9d174d", "--accent-foreground": "#fce7f3",
      "--destructive": "#ef4444",
      "--border": "#4a2535", "--input": "#4a2535", "--ring": "#ec4899",
      "--sidebar": "#140e11", "--sidebar-foreground": "#fce7f3",
      "--sidebar-primary": "#ec4899", "--sidebar-border": "#3b202c",
      "--sidebar-accent": "#3b202c", "--sidebar-accent-foreground": "#fce7f3",
      "--sidebar-ring": "#ec4899",
      "--chart-1": "#ec4899", "--chart-2": "#f472b6", "--chart-3": "#a855f7",
      "--chart-4": "#fb7185", "--chart-5": "#ec4899",
    },
  },
];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [accentColor, setAccentColorState] = useState("oklch(0.648 0.17 160)"); // default emerald
  const [fontFamily, setFontFamilyState] = useState("inter"); // default inter
  const [fontSize, setFontSizeState] = useState("medium"); // default medium
  const [soundEnabled, setSoundEnabledState] = useState(false); // default off
  const [customTheme, setCustomThemeState] = useState<Record<string, string>>({});
  const [userPreset, setUserPresetState] = useState<Record<string, string> | null>(null);
  const [themeEditorOpen, setThemeEditorOpen] = useState(false);

  useEffect(() => {
    // Load saved preferences from localStorage
    const savedTheme = localStorage.getItem("gbms-theme") as Theme | null;
    const savedAccent = localStorage.getItem("gbms-accent");
    const savedFontFamily = localStorage.getItem("gbms-font-family");
    const savedFontSize = localStorage.getItem("gbms-font-size");
    const savedSound = localStorage.getItem("gbms-sound-enabled");
    const savedCustomTheme = localStorage.getItem("gbms-custom-theme");
    const savedUserPreset = localStorage.getItem("gbms-user-preset");

    if (savedTheme) setThemeState(savedTheme);
    if (savedAccent) setAccentColorState(savedAccent);
    if (savedFontFamily) setFontFamilyState(savedFontFamily);
    if (savedFontSize) setFontSizeState(savedFontSize);
    if (savedSound !== null) setSoundEnabledState(savedSound === "true");

    if (savedUserPreset) {
      try {
        setUserPresetState(JSON.parse(savedUserPreset));
      } catch {}
    }

    // Restore custom theme overrides
    if (savedCustomTheme) {
      try {
        const parsed = JSON.parse(savedCustomTheme);
        setCustomThemeState(parsed);
        // Apply all saved overrides immediately
        Object.entries(parsed).forEach(([token, value]) => {
          document.documentElement.style.setProperty(token, value as string);
        });
      } catch { /* ignore invalid JSON */ }
    }

    // Register Service Worker for PWA
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // ignore registration errors
      });
    }
  }, []);

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    localStorage.setItem("gbms-sound-enabled", enabled.toString());
  };

  // ── Sound System (deployed-safe) ──────────────────────────────────
  const audioUnlockedRef = useRef(false);
  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const errorAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const success = new Audio("/sounds/gta_v.mp3");
      success.preload = "auto";
      success.load();
      successAudioRef.current = success;

      const error = new Audio("/sounds/duck.mp3");
      error.preload = "auto";
      error.load();
      errorAudioRef.current = error;
    } catch {
      // Audio not available in this environment
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const unlock = () => {
      if (audioUnlockedRef.current) return;
      audioUnlockedRef.current = true;

      [successAudioRef.current, errorAudioRef.current].forEach((audio) => {
        if (audio) {
          audio.volume = 0;
          audio.play().then(() => {
            audio.pause();
            audio.currentTime = 0;
            audio.volume = 0.5;
          }).catch(() => { });
        }
      });
    };

    document.addEventListener("click", unlock, { once: true });
    document.addEventListener("touchstart", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });

    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, []);

  const playSound = useCallback((type: "success" | "error" | "warning" | "click" | "create" | "delete") => {
    if (!soundEnabled) return;

    const isDestructive = type === "delete" || type === "error";
    const sourceAudio = isDestructive ? errorAudioRef.current : successAudioRef.current;

    if (!sourceAudio) return;

    try {
      const clone = sourceAudio.cloneNode() as HTMLAudioElement;
      clone.volume = 0.5;
      clone.play().catch(() => { });
      clone.addEventListener("ended", () => { clone.remove(); }, { once: true });
    } catch {
      // Silently fail
    }
  }, [soundEnabled]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }
    localStorage.setItem("gbms-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!customTheme["--primary"]) document.documentElement.style.setProperty("--primary", accentColor);
    if (!customTheme["--ring"]) document.documentElement.style.setProperty("--ring", accentColor);
    if (!customTheme["--sidebar-primary"]) document.documentElement.style.setProperty("--sidebar-primary", accentColor);
    if (!customTheme["--chart-1"]) document.documentElement.style.setProperty("--chart-1", accentColor);

    if (!customTheme["--primary-foreground"]) {
      const match = accentColor.match(/oklch\(([\d.]+)/);
      if (match && match[1]) {
        const lightness = parseFloat(match[1]);
        const foreground = lightness > 0.65 ? "oklch(0.15 0.01 260)" : "oklch(0.98 0 0)";
        document.documentElement.style.setProperty("--primary-foreground", foreground);
      }
    }

    // Re-apply custom theme overrides to ensure they win over the default accent color during hydration
    Object.entries(customTheme).forEach(([token, value]) => {
      document.documentElement.style.setProperty(token, value as string);
    });

    localStorage.setItem("gbms-accent", accentColor);
  }, [accentColor, customTheme]);

  useEffect(() => {
    let cssFontFamily = "var(--font-sans)";
    if (fontFamily === "roboto") cssFontFamily = "'Roboto', sans-serif";
    if (fontFamily === "outfit") cssFontFamily = "'Outfit', sans-serif";
    if (fontFamily === "poppins") cssFontFamily = "'Poppins', sans-serif";
    if (fontFamily === "josefin") cssFontFamily = "'Josefin Sans', sans-serif";
    if (fontFamily === "rubik") cssFontFamily = "'Rubik', sans-serif";
    if (fontFamily === "lato") cssFontFamily = "'Lato', sans-serif";
    if (fontFamily === "ranade") cssFontFamily = "'Ranade', sans-serif";
    if (fontFamily === "source-sans") cssFontFamily = "'Source Sans 3', sans-serif";
    if (fontFamily === "manrope") cssFontFamily = "'Manrope', sans-serif";
    if (fontFamily === "montserrat") cssFontFamily = "'Montserrat', sans-serif";
    if (fontFamily === "playfair") cssFontFamily = "'Playfair Display', serif";
    if (fontFamily === "geist") cssFontFamily = "var(--font-geist-sans), sans-serif";
    if (fontFamily === "monospace") cssFontFamily = "var(--font-geist-mono), monospace";

    document.documentElement.style.setProperty("--font-sans", cssFontFamily);
    localStorage.setItem("gbms-font-family", fontFamily);
  }, [fontFamily]);

  useEffect(() => {
    let rootFontSize = "16px";
    if (fontSize === "small") rootFontSize = "14px";
    if (fontSize === "large") rootFontSize = "18px";
    if (fontSize === "xlarge") rootFontSize = "20px";

    document.documentElement.style.fontSize = rootFontSize;
    localStorage.setItem("gbms-font-size", fontSize);
  }, [fontSize]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const setTheme = (t: Theme) => setThemeState(t);
  const setAccentColor = (c: string) => setAccentColorState(c);
  const setFontFamily = (f: string) => setFontFamilyState(f);
  const setFontSize = (s: string) => setFontSizeState(s);

  // ── Custom Theme Editor Methods ──────────────────────────────────
  const setTokenColor = useCallback((token: string, value: string) => {
    setCustomThemeState((prev) => {
      const next = { ...prev, [token]: value };
      localStorage.setItem("gbms-custom-theme", JSON.stringify(next));
      document.documentElement.style.setProperty(token, value);
      return next;
    });
  }, []);

  const resetCustomTheme = useCallback(() => {
    Object.keys(customTheme).forEach((token) => {
      document.documentElement.style.removeProperty(token);
    });
    setCustomThemeState({});
    localStorage.removeItem("gbms-custom-theme");
    document.documentElement.style.setProperty("--primary", accentColor);
    document.documentElement.style.setProperty("--ring", accentColor);
    document.documentElement.style.setProperty("--sidebar-primary", accentColor);
    document.documentElement.style.setProperty("--chart-1", accentColor);
  }, [customTheme, accentColor]);

  const importTheme = useCallback((themeOverrides: Record<string, string>) => {
    Object.keys(customTheme).forEach((token) => {
      document.documentElement.style.removeProperty(token);
    });
    Object.entries(themeOverrides).forEach(([token, value]) => {
      document.documentElement.style.setProperty(token, value);
    });
    setCustomThemeState(themeOverrides);
    localStorage.setItem("gbms-custom-theme", JSON.stringify(themeOverrides));
  }, [customTheme]);

  const exportTheme = useCallback(() => {
    return { ...customTheme };
  }, [customTheme]);

  const saveUserPreset = useCallback(() => {
    setUserPresetState(customTheme);
    localStorage.setItem("gbms-user-preset", JSON.stringify(customTheme));
  }, [customTheme]);

  const applyUserPreset = useCallback(() => {
    if (userPreset) {
      importTheme(userPreset);
    }
  }, [userPreset, importTheme]);

  useEffect(() => {
    if (themeEditorOpen) {
      document.body.classList.add("theme-editor-open");
    } else {
      document.body.classList.remove("theme-editor-open");
    }
  }, [themeEditorOpen]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
        accentColor,
        setAccentColor,
        fontFamily,
        setFontFamily,
        fontSize,
        setFontSize,
        soundEnabled,
        setSoundEnabled,
        playSound,
        customTheme,
        setTokenColor,
        resetCustomTheme,
        importTheme,
        exportTheme,
        userPreset,
        saveUserPreset,
        applyUserPreset,
        themeEditorOpen,
        setThemeEditorOpen,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
