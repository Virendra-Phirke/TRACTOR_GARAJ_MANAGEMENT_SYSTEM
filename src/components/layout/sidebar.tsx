"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Tractor,
  Package,
  FileText,
  Settings,
  Receipt,
  BarChart3,
  Wrench,
  ChevronLeft,
  ChevronRight,
  UserCircle2,
  LineChart,
  X,
  Paintbrush,
} from "lucide-react";
import { useState, createContext, useContext, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from "@/components/theme-provider";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/vehicles", label: "Vehicles", icon: Tractor },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/profile", label: "Owner Profile", icon: UserCircle2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

// ── Sidebar context for mobile toggle ────────────────────────────────
interface SidebarContextType {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  mobileOpen: false,
  setMobileOpen: () => { },
  toggle: () => { },
});

export function useSidebar() {
  return useContext(SidebarContext);
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggle = useCallback(() => setMobileOpen((prev) => !prev), []);
  return (
    <SidebarContext.Provider value={{ mobileOpen, setMobileOpen, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { mobileOpen, setMobileOpen } = useSidebar();
  const { setThemeEditorOpen, customTheme } = useTheme();
  const themeOverrideCount = Object.keys(customTheme).length;

  const navContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 md:h-16 border-b border-sidebar-border shrink-0">
        <div className="w-14 h-12 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Logo" width={36} height={36} className="w-full h-full object-contain" />
        </div>
        {(!collapsed || mobileOpen) && (
          <div className="overflow-hidden flex-1">
            <h1 className="text-sm font-bold tracking-tight truncate">GBMS</h1>
            <p className="text-[10px] text-muted-foreground truncate">
              Garage Billing
            </p>
          </div>
        )}
        {/* Close button on mobile */}
        {mobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          const handleClick = () => {
            // Close mobile sidebar on nav
            setMobileOpen(false);
          };

          const linkContent = (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-sm shadow-primary/5"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon
                className={cn(
                  "w-[18px] h-[18px] shrink-0",
                  isActive ? "text-primary" : ""
                )}
              />
              {/* Always show label on mobile, respect collapsed on desktop */}
              <span className={cn("truncate", !mobileOpen && collapsed ? "hidden" : "")}>
                {item.label}
              </span>
            </Link>
          );

          if (collapsed && !mobileOpen) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger render={linkContent} />
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return linkContent;
        })}

        {/* Theme Editor button */}
        {(() => {
          const themeButton = (
            <button
              onClick={() => {
                setThemeEditorOpen(true);
                setMobileOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 w-full text-left cursor-pointer",
                "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <Paintbrush
                className="w-[18px] h-[18px] shrink-0"
              />
              <span className={cn("truncate", !mobileOpen && collapsed ? "hidden" : "")}>
                Theme
              </span>
              {themeOverrideCount > 0 && (!collapsed || mobileOpen) && (
                <span className="ml-auto text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                  {themeOverrideCount}
                </span>
              )}
            </button>
          );

          if (collapsed && !mobileOpen) {
            return (
              <Tooltip key="theme-editor">
                <TooltipTrigger render={themeButton} />
                <TooltipContent side="right" sideOffset={8}>
                  Theme Editor
                </TooltipContent>
              </Tooltip>
            );
          }

          return themeButton;
        })()}
      </nav>

      {/* Collapse toggle — desktop only */}
      <div className="px-2 py-3 border-t border-sidebar-border shrink-0 hidden md:block">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center text-muted-foreground hover:text-foreground cursor-pointer"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 mr-2" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* ── Desktop Sidebar ───────────────────────────────────────── */}
      <aside
        className={cn(
          "h-screen sticky top-0 flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out no-print",
          "hidden md:flex",
          collapsed ? "w-[68px]" : "w-[240px]"
        )}
      >
        {navContent}
      </aside>

      {/* ── Mobile Sidebar Overlay ────────────────────────────────── */}
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileOpen(false)}
      />

      {/* Slide-in panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] flex flex-col bg-sidebar border-r border-sidebar-border shadow-2xl transition-transform duration-300 ease-in-out md:hidden no-print",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navContent}
      </aside>
    </>
  );
}
