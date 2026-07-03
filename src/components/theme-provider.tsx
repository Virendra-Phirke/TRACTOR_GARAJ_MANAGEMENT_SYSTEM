"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [accentColor, setAccentColorState] = useState("oklch(0.648 0.17 160)"); // default emerald
  const [fontFamily, setFontFamilyState] = useState("inter"); // default inter
  const [fontSize, setFontSizeState] = useState("medium"); // default medium
  const [soundEnabled, setSoundEnabledState] = useState(false); // default off

  useEffect(() => {
    // Load saved preferences from localStorage
    const savedTheme = localStorage.getItem("gbms-theme") as Theme | null;
    const savedAccent = localStorage.getItem("gbms-accent");
    const savedFontFamily = localStorage.getItem("gbms-font-family");
    const savedFontSize = localStorage.getItem("gbms-font-size");
    const savedSound = localStorage.getItem("gbms-sound-enabled");
    
    if (savedTheme) setThemeState(savedTheme);
    if (savedAccent) setAccentColorState(savedAccent);
    if (savedFontFamily) setFontFamilyState(savedFontFamily);
    if (savedFontSize) setFontSizeState(savedFontSize);
    if (savedSound !== null) setSoundEnabledState(savedSound === "true");
  }, []);

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    localStorage.setItem("gbms-sound-enabled", enabled.toString());
  };

  const playSound = (type: "success" | "error" | "warning" | "click" | "create" | "delete") => {
    if (!soundEnabled) return;
    
    // Use gta_v.mp3 for creation/success/notification sounds
    // Use duck.mp3 for deletion/error/destructive sounds
    const isDestructive = type === "delete" || type === "error";
    const audioSrc = isDestructive ? "/sounds/duck.mp3" : "/sounds/gta_v.mp3";
    
    try {
      const audio = new Audio(audioSrc);
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Silently fail if autoplay is blocked
      });
    } catch {
      // Silently fail if Audio is not available
    }
  };

  useEffect(() => {
    // Apply theme class to <html>
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
    // Apply accent color as CSS custom property
    document.documentElement.style.setProperty("--primary", accentColor);
    // Also set ring to match
    document.documentElement.style.setProperty("--ring", accentColor);
    // Parse hue for sidebar-primary and chart-1
    document.documentElement.style.setProperty("--sidebar-primary", accentColor);
    document.documentElement.style.setProperty("--chart-1", accentColor);
    
    // Automatically determine high-contrast foreground color based on lightness
    const match = accentColor.match(/oklch\(([\d.]+)/);
    if (match && match[1]) {
      const lightness = parseFloat(match[1]);
      // If the color is very light (L > 0.65), use dark text; otherwise use white text
      const foreground = lightness > 0.65 ? "oklch(0.15 0.01 260)" : "oklch(0.98 0 0)";
      document.documentElement.style.setProperty("--primary-foreground", foreground);
    }
    
    localStorage.setItem("gbms-accent", accentColor);
  }, [accentColor]);

  useEffect(() => {
    // Apply font family as CSS custom property
    let cssFontFamily = "var(--font-sans)"; // Default fallback to next/font/google if defined
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
    // Apply font size to document root
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
