"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
// Sheet removed — theme editor now renders inline inside the flex layout
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import ColorPicker from "@/components/ui/color-picker";
import { Button } from "@/components/ui/button";
import {
  Paintbrush,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Upload,
  Copy,
  Check,
  Sparkles,
  MousePointerClick,
  X
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme, THEME_TOKENS, THEME_PRESETS } from "@/components/theme-provider";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function extractTokens(el: Element): string[] {
  let current: Element | null = el;
  while (current && current !== document.body) {
    const classes = current.className;
    if (typeof classes === 'string') {
      const tokens = new Set<string>();
      classes.split(/\s+/).forEach(c => {
        if (c === "border") tokens.add("--border");
        if (c === "text-foreground") tokens.add("--foreground");
        const match = c.match(/^(?:bg|text|border|ring)-([a-z0-9-]+)$/);
        if (match) {
          const name = match[1];
          if (c.startsWith("text-")) {
            const fgToken = `--${name}-foreground`;
            if (THEME_TOKENS.some(t => t.token === fgToken)) tokens.add(fgToken);
          }
          const token = `--${name}`;
          if (THEME_TOKENS.some(t => t.token === token)) tokens.add(token);
        }
      });
      if (tokens.size > 0) return Array.from(tokens);
    }
    current = current.parentElement;
  }
  return [];
}

// ── oklch / hex conversion helpers ──────────────────────────────────
// We need these because CSS vars use oklch but <input type="color"> needs hex.

function oklchToHex(oklchStr: string): string {
  // Try to parse oklch string; fallback: use a canvas-based approach
  if (typeof document === "undefined") return "#888888";
  try {
    const el = document.createElement("div");
    el.style.color = oklchStr;
    document.body.appendChild(el);
    const computed = getComputedStyle(el).color;
    document.body.removeChild(el);
    // computed is usually rgb(r, g, b) or rgba(...)
    const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);
      return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    }
    return "#888888";
  } catch {
    return "#888888";
  }
}

function getResolvedColor(token: string): string {
  if (typeof document === "undefined") return "#888888";
  try {
    const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
    if (!value) return "#888888";
    // If it's already hex, return it
    if (value.startsWith("#")) return value;
    // Convert oklch or any CSS color to hex
    return oklchToHex(value);
  } catch {
    return "#888888";
  }
}

// Group tokens by their group property
function groupTokens() {
  const groups: Record<string, typeof THEME_TOKENS> = {};
  for (const token of THEME_TOKENS) {
    if (!groups[token.group]) groups[token.group] = [];
    groups[token.group].push(token);
  }
  return groups;
}

// ── Color Picker Row ────────────────────────────────────────────────
function ColorTokenRow({
  token,
  label,
  currentValue,
  onChangeColor,
  onReset,
  isOverridden,
}: {
  token: string;
  label: string;
  currentValue: string;
  defaultValue: string;
  onChangeColor: (token: string, hex: string) => void;
  onReset: (token: string) => void;
  isOverridden: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-2 py-1.5 px-1 group">
      {/* Color swatch trigger for custom picker */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <button className="relative w-7 h-7 rounded-md border border-border/50 cursor-pointer overflow-hidden shrink-0 transition-all hover:scale-110 hover:shadow-md">
              <div
                className="absolute inset-0 rounded-md"
                style={{ backgroundColor: currentValue }}
              />
            </button>
          }
        />
        <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" align="start" sideOffset={10}>
          <ColorPicker
            value={currentValue}
            onChange={(hex) => onChangeColor(token, hex)}
            onClose={() => setOpen(false)}
          />
        </PopoverContent>
      </Popover>

      {/* Label + hex */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate leading-tight">{label}</p>
        <p className="text-[10px] text-muted-foreground font-mono leading-tight">
          {currentValue}
        </p>
      </div>

      {/* Hex input */}
      <input
        type="text"
        value={currentValue}
        onChange={(e) => {
          const v = e.target.value;
          if (/^#[0-9a-fA-F]{6}$/.test(v)) {
            onChangeColor(token, v);
          }
        }}
        onBlur={(e) => {
          let v = e.target.value.trim();
          if (!v.startsWith("#")) v = "#" + v;
          if (/^#[0-9a-fA-F]{6}$/.test(v)) {
            onChangeColor(token, v);
          }
        }}
        className="w-[72px] h-6 text-[10px] font-mono bg-muted/50 border border-border/30 rounded px-1.5 text-center focus:outline-none focus:ring-1 focus:ring-ring/50"
      />

      {/* Reset button (only show if overridden) */}
      {isOverridden && (
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                onClick={() => onReset(token)}
                className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            }
          />
          <TooltipContent side="left">Reset to default</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

// ── Collapsible Group ───────────────────────────────────────────────
function TokenGroup({
  groupName,
  tokens,
  resolvedColors,
  customTheme,
  defaultKey,
  onChangeColor,
  onResetToken,
  initialOpen = false,
}: {
  groupName: string;
  tokens: typeof THEME_TOKENS;
  resolvedColors: Record<string, string>;
  customTheme: Record<string, string>;
  defaultKey: "defaultDark" | "defaultLight";
  onChangeColor: (token: string, hex: string) => void;
  onResetToken: (token: string) => void;
  initialOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const overriddenCount = tokens.filter((t) => customTheme[t.token]).length;

  return (
    <div className="border border-border/30 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-accent/30 transition-colors cursor-pointer"
      >
        {isOpen ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        )}
        <span className="text-xs font-semibold flex-1">{groupName}</span>

        {/* Color preview dots */}
        <div className="flex gap-0.5 mr-1">
          {tokens.slice(0, 4).map((t) => (
            <div
              key={t.token}
              className="w-3 h-3 rounded-full border border-border/30"
              style={{ backgroundColor: resolvedColors[t.token] || "#888" }}
            />
          ))}
        </div>

        {overriddenCount > 0 && (
          <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
            {overriddenCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="px-2 pb-2 space-y-0.5 border-t border-border/20">
          {tokens.map((t) => (
            <ColorTokenRow
              key={t.token}
              token={t.token}
              label={t.label}
              currentValue={customTheme[t.token] || resolvedColors[t.token] || "#888888"}
              defaultValue={t[defaultKey]}
              onChangeColor={onChangeColor}
              onReset={onResetToken}
              isOverridden={!!customTheme[t.token]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Page-to-relevant-groups mapping
const PAGE_GROUPS: Record<string, string[]> = {
  "/": ["Base", "Cards", "Charts"],
  "/customers": ["Base", "Cards", "Borders & Inputs"],
  "/vehicles": ["Base", "Cards", "Borders & Inputs"],
  "/inventory": ["Base", "Cards", "Borders & Inputs"],
  "/invoices": ["Base", "Cards", "Primary", "Borders & Inputs"],
  "/expenses": ["Base", "Cards", "Borders & Inputs"],
  "/reports": ["Base", "Cards", "Charts"],
  "/analytics": ["Base", "Cards", "Charts"],
  "/profile": ["Base", "Cards"],
  "/settings": ["Base", "Primary", "Sidebar"],
};

function getRelevantGroups(pathname: string): string[] {
  // Check exact match first, then prefix match
  if (PAGE_GROUPS[pathname]) return PAGE_GROUPS[pathname];
  for (const [route, groups] of Object.entries(PAGE_GROUPS)) {
    if (route !== "/" && pathname.startsWith(route)) return groups;
  }
  return ["Base", "Primary"]; // fallback
}

// ── Main ThemeEditor Component ──────────────────────────────────────
export function ThemeEditor() {
  const {
    theme,
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
  } = useTheme();
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);
  const [inspectorMode, setInspectorMode] = useState(false);
  const [inspectResult, setInspectResult] = useState<{ x: number; y: number; tokens: string[] } | null>(null);
  const [inspectActiveToken, setInspectActiveToken] = useState<string | null>(null);

  const groups = useMemo(() => groupTokens(), []);
  const defaultKey = theme === "dark" ? "defaultDark" : "defaultLight";
  const relevantGroups = useMemo(() => getRelevantGroups(pathname), [pathname]);

  // Resolve current computed colors for all tokens
  const [resolvedColors, setResolvedColors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!inspectorMode) return;

    const highlightBox = document.createElement("div");
    highlightBox.id = "theme-inspector-highlight";
    highlightBox.style.position = "fixed";
    highlightBox.style.pointerEvents = "none";
    highlightBox.style.zIndex = "99999";
    highlightBox.style.border = "2px dashed #3b82f6";
    highlightBox.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
    highlightBox.style.transition = "all 0.1s ease-out";
    highlightBox.style.display = "none";
    document.body.appendChild(highlightBox);

    const onPointerMove = (e: PointerEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
      if (!el || el.closest('[role="dialog"]') || el.closest('#theme-inspector-highlight') || el.closest('.inspector-popup')) {
        highlightBox.style.display = "none";
        return;
      }
      
      const tokens = extractTokens(el);
      if (tokens.length > 0) {
        const rect = el.getBoundingClientRect();
        highlightBox.style.display = "block";
        highlightBox.style.left = `${rect.left - 4}px`;
        highlightBox.style.top = `${rect.top - 4}px`;
        highlightBox.style.width = `${rect.width + 8}px`;
        highlightBox.style.height = `${rect.height + 8}px`;
      } else {
        highlightBox.style.display = "none";
      }
    };

    const onClick = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
      if (!el || el.closest('[role="dialog"]') || el.closest('.inspector-popup')) return;

      const tokens = extractTokens(el);
      if (tokens.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        setInspectorMode(false);
        setInspectResult({ 
          x: Math.min(e.clientX + 10, window.innerWidth - 250), 
          y: Math.min(e.clientY + 10, window.innerHeight - 300), 
          tokens 
        });
        setInspectActiveToken(null);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setInspectorMode(false);
    };

    document.addEventListener("pointermove", onPointerMove, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("pointermove", onPointerMove, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("keydown", onKeyDown, true);
      highlightBox.remove();
    };
  }, [inspectorMode]);

  // Refresh resolved colors when sheet opens or theme changes
  const refreshColors = useCallback(() => {
    const colors: Record<string, string> = {};
    for (const t of THEME_TOKENS) {
      if (customTheme[t.token]) {
        colors[t.token] = customTheme[t.token];
      } else {
        colors[t.token] = getResolvedColor(t.token);
      }
    }
    setResolvedColors(colors);
  }, [customTheme]);

  // Refresh colors when editor opens
  useEffect(() => {
    if (themeEditorOpen) {
      setTimeout(refreshColors, 50);
    }
  }, [themeEditorOpen, refreshColors]);

  const handleChangeColor = useCallback(
    (token: string, hex: string) => {
      setTokenColor(token, hex);
      setResolvedColors((prev) => ({ ...prev, [token]: hex }));
    },
    [setTokenColor]
  );

  const handleResetToken = useCallback(
    (token: string) => {
      // Remove just this one override
      const updated = { ...customTheme };
      delete updated[token];
      document.documentElement.style.removeProperty(token);
      importTheme(updated);
      // Refresh the resolved color for this token
      setTimeout(() => {
        setResolvedColors((prev) => ({
          ...prev,
          [token]: getResolvedColor(token),
        }));
      }, 50);
    },
    [customTheme, importTheme]
  );

  const handleReset = () => {
    resetCustomTheme();
    setTimeout(refreshColors, 50);
    toast.success("Theme reset to defaults");
  };

  const handleExport = () => {
    const data = exportTheme();
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Theme JSON copied to clipboard");
  };

  const handleImport = () => {
    const input = prompt("Paste your theme JSON:");
    if (!input) return;
    try {
      const parsed = JSON.parse(input);
      if (typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid");
      importTheme(parsed);
      setTimeout(refreshColors, 50);
      toast.success("Theme imported successfully");
    } catch {
      toast.error("Invalid theme JSON");
    }
  };

  const handlePreset = (overrides: Record<string, string>) => {
    importTheme(overrides);
    setTimeout(refreshColors, 50);
    toast.success("Preset applied!");
  };

  const overrideCount = Object.keys(customTheme).length;

  return (
    <>
    {/* Inline panel — lives inside the flex layout so it naturally pushes <main> to shrink */}
    <div
      className={`shrink-0 h-full border-l border-border bg-popover text-popover-foreground flex flex-col overflow-hidden transition-[width] duration-300 ease-in-out ${
        themeEditorOpen ? "w-[380px]" : "w-0 border-l-0"
      }`}
    >
      <div className="w-[380px] h-full flex flex-col">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 border-b border-border/30 shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Paintbrush className="w-4 h-4 text-primary" />
              Theme Editor
            </h3>
            <button
              onClick={() => setThemeEditorOpen(false)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Customize every color in the app. Changes apply instantly and persist.
          </p>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          
          <Button
            variant={inspectorMode ? "secondary" : "outline"}
            className={`w-full gap-2 border-dashed ${inspectorMode ? 'bg-blue-500/20 text-blue-400 border-blue-500/50 hover:bg-blue-500/30' : 'hover:bg-accent'}`}
            onClick={() => {
              setInspectorMode(!inspectorMode);
              if (!inspectorMode) setThemeEditorOpen(false);
            }}
          >
            <MousePointerClick className="w-4 h-4" />
            {inspectorMode ? "Inspector Active (Click outside)" : "Pick Element from Screen"}
          </Button>

          {/* ── Quick Presets ─────────────────────────────────────── */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Quick Presets
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {THEME_PRESETS.map((preset) => (
                <Tooltip key={preset.name}>
                  <TooltipTrigger
                    render={
                      <button
                        onClick={() => handlePreset(preset.overrides)}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg border border-border/30 hover:border-primary/40 hover:bg-accent/30 transition-all cursor-pointer group"
                      >
                        {/* Color preview */}
                        <div className="flex gap-0.5">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: preset.overrides["--background"] }}
                          />
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: preset.overrides["--primary"] }}
                          />
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: preset.overrides["--card"] }}
                          />
                        </div>
                        <span className="text-[9px] font-medium truncate w-full text-center leading-tight">
                          {preset.emoji}
                        </span>
                      </button>
                    }
                  />
                  <TooltipContent side="bottom" className="text-xs">
                    {preset.name}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* ── My Custom Preset ─────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Paintbrush className="w-3 h-3" />
                My Preset
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px] px-2 cursor-pointer"
                onClick={() => {
                  saveUserPreset();
                  toast.success("Saved as your custom preset!");
                }}
              >
                Save Current
              </Button>
            </div>
            {userPreset ? (
              <button
                onClick={() => {
                  applyUserPreset();
                  setTimeout(refreshColors, 50);
                  toast.success("Applied your custom preset!");
                }}
                className="w-full flex items-center gap-2 p-2 rounded-lg border border-border/30 hover:border-primary/40 hover:bg-accent/30 transition-all cursor-pointer group"
              >
                <div className="flex gap-0.5">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: userPreset["--background"] || "#000" }} />
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: userPreset["--primary"] || "#000" }} />
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: userPreset["--card"] || "#000" }} />
                </div>
                <span className="text-xs font-medium flex-1 text-left">My Saved Preset</span>
              </button>
            ) : (
              <div className="p-3 rounded-lg border border-border/30 border-dashed text-center text-[10px] text-muted-foreground">
                No preset saved yet. Modify colors and click &quot;Save Current&quot;.
              </div>
            )}
          </div>

          {/* ── Token Groups ─────────────────────────────────────── */}
          {/* Relevant groups for current page shown first & auto-expanded */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Current Page
            </p>
            <div className="space-y-1.5">
              {Object.entries(groups)
                .filter(([groupName]) => relevantGroups.includes(groupName))
                .map(([groupName, tokens]) => (
                  <TokenGroup
                    key={groupName}
                    groupName={groupName}
                    tokens={tokens}
                    resolvedColors={resolvedColors}
                    customTheme={customTheme}
                    defaultKey={defaultKey as "defaultDark" | "defaultLight"}
                    onChangeColor={handleChangeColor}
                    onResetToken={handleResetToken}
                    initialOpen={true}
                  />
                ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              All Colors
            </p>
            <div className="space-y-1.5">
              {Object.entries(groups)
                .filter(([groupName]) => !relevantGroups.includes(groupName))
                .map(([groupName, tokens]) => (
                  <TokenGroup
                    key={groupName}
                    groupName={groupName}
                    tokens={tokens}
                    resolvedColors={resolvedColors}
                    customTheme={customTheme}
                    defaultKey={defaultKey as "defaultDark" | "defaultLight"}
                    onChangeColor={handleChangeColor}
                    onResetToken={handleResetToken}
                  />
                ))}
            </div>
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-border/30 px-3 py-3 space-y-2 bg-card/50">
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 text-xs h-8 cursor-pointer"
              onClick={handleExport}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied!" : "Export"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 text-xs h-8 cursor-pointer"
              onClick={handleImport}
            >
              <Upload className="w-3 h-3" />
              Import
            </Button>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="w-full gap-1.5 text-xs h-8 cursor-pointer"
            onClick={handleReset}
            disabled={overrideCount === 0}
          >
            <RotateCcw className="w-3 h-3" />
            Reset All ({overrideCount} overrides)
          </Button>
        </div>
      </div>
    </div>

    {/* Inspector Result Menu */}
    {inspectResult && !inspectActiveToken && (
      <div 
        className="inspector-popup"
        style={{ 
          position: 'fixed', 
          left: inspectResult.x, 
          top: inspectResult.y, 
          zIndex: 99999, 
          backgroundColor: '#18181b', 
          padding: '12px', 
          borderRadius: '12px', 
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.1)',
          minWidth: '200px'
        }}
      >
        <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
          <span className="text-xs font-semibold text-white/90">Inspect Colors</span>
          <button 
            onClick={() => setInspectResult(null)}
            className="text-white/50 hover:text-white"
            aria-label="Close Inspector"
          >
            <X size={14} />
          </button>
        </div>
        <div className="space-y-1">
          {inspectResult.tokens.map(token => {
            const tokenInfo = THEME_TOKENS.find(t => t.token === token);
            if (!tokenInfo) return null;
            const color = customTheme[token] || resolvedColors[token] || "#888888";
            
            return (
              <button
                key={token}
                onClick={() => setInspectActiveToken(token)}
                className="w-full flex items-center gap-3 px-2 py-2 hover:bg-white/10 rounded-md transition-colors text-left"
              >
                <div 
                  className="w-4 h-4 rounded-full shrink-0 border border-white/20 shadow-sm" 
                  style={{ backgroundColor: color }} 
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">{tokenInfo.label}</div>
                  <div className="text-[10px] text-white/50 font-mono truncate">{token}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    )}

    {/* Inline Color Picker */}
    {inspectActiveToken && inspectResult && (
      <div 
        className="inspector-popup"
        style={{ 
          position: 'fixed', 
          left: inspectResult.x, 
          top: inspectResult.y, 
          zIndex: 99999 
        }}
      >
        <ColorPicker 
          value={customTheme[inspectActiveToken] || resolvedColors[inspectActiveToken] || "#888888"}
          onChange={(hex) => handleChangeColor(inspectActiveToken, hex)}
          onClose={() => { setInspectActiveToken(null); setInspectResult(null); }}
        />
      </div>
    )}
    </>
  );
}
