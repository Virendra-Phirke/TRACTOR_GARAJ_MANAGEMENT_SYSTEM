"use client";

import { useEffect, useState } from "react";
import { logoutAction, getOwnerName } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { LogOut, User, Moon, Sun, Menu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/components/layout/sidebar";

export function Header({ title, ownerName: initialOwnerName }: { title?: string; ownerName?: string }) {
  const [ownerName, setOwnerName] = useState(initialOwnerName || "Garage Owner");
  const { theme, toggleTheme } = useTheme();
  const { toggle } = useSidebar();

  useEffect(() => {
    if (!initialOwnerName) {
      getOwnerName().then(setOwnerName);
    }
  }, [initialOwnerName]);

  return (
    <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 no-print">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden w-8 h-8 cursor-pointer text-muted-foreground hover:text-foreground"
          onClick={toggle}
        >
          <Menu className="w-5 h-5" />
        </Button>
        {title && (
          <h2 className="text-base md:text-lg font-semibold tracking-tight">{title}</h2>
        )}
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        {/* Theme toggle */}
        <Tooltip>
          <TooltipTrigger render={
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 cursor-pointer text-muted-foreground hover:text-foreground"
              onClick={toggleTheme}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
          } />
          <TooltipContent side="bottom">
            {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          </TooltipContent>
        </Tooltip>

        {/* Owner dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium hidden sm:inline">
                  {ownerName || "Garage Owner"}
                </span>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem disabled className="text-xs text-muted-foreground">
              {ownerName || "GARAJ_OWNER"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => logoutAction()}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
