"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ShortcutsModal({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div>
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
              Global Actions
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Command Palette</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border">Ctrl</kbd>
                  <span className="text-muted-foreground text-xs my-auto">+</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border">K</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Save Form / Data</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border">Ctrl</kbd>
                  <span className="text-muted-foreground text-xs my-auto">+</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border">S</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Print / Generate PDF</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border">Ctrl</kbd>
                  <span className="text-muted-foreground text-xs my-auto">+</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border">P</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">New Invoice</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border">c</kbd>
                  <span className="text-muted-foreground text-xs my-auto">then</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border">n</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Show this cheat sheet</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border">?</kbd>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
              Navigation
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Go to Dashboard</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border">g</kbd>
                  <span className="text-muted-foreground text-xs my-auto">then</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border">d</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Go to Invoices</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border">g</kbd>
                  <span className="text-muted-foreground text-xs my-auto">then</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border">i</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Go to Payment History</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border">g</kbd>
                  <span className="text-muted-foreground text-xs my-auto">then</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border">h</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Go to Customers</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border">g</kbd>
                  <span className="text-muted-foreground text-xs my-auto">then</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border">c</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Go to Vehicles</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border">g</kbd>
                  <span className="text-muted-foreground text-xs my-auto">then</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border">v</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Go to Inventory</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border">g</kbd>
                  <span className="text-muted-foreground text-xs my-auto">then</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border">p</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Go to Expenses</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border">g</kbd>
                  <span className="text-muted-foreground text-xs my-auto">then</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border">e</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Go to Settings</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border">g</kbd>
                  <span className="text-muted-foreground text-xs my-auto">then</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border">s</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
