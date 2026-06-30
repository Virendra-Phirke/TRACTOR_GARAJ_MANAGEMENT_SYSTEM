"use client";

import { useEffect, useState } from "react";
import { logoutAction, getOwnerName } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header({ title, ownerName: initialOwnerName }: { title?: string; ownerName?: string }) {
  const [ownerName, setOwnerName] = useState(initialOwnerName || "Garage Owner");

  useEffect(() => {
    if (!initialOwnerName) {
      getOwnerName().then(setOwnerName);
    }
  }, [initialOwnerName]);

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-30 no-print">
      <div>
        {title && (
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        )}
      </div>

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
    </header>
  );
}
