"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CommandPalette } from "./command-palette";
import { ShortcutsModal } from "./shortcuts-modal";

export function GlobalShortcuts() {
  const router = useRouter();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  
  // State to track if 'g' or 'c' was pressed recently for sequence shortcuts
  const [gPressed, setGPressed] = useState(false);
  const [cPressed, setCPressed] = useState(false);

  useEffect(() => {
    let gTimeout: NodeJS.Timeout;
    let cTimeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT" ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      // '?' (Shift + /)
      if (e.key === "?") {
        e.preventDefault();
        setShortcutsOpen((open) => !open);
      }

      // Cmd/Ctrl + K for Command Palette
      if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setCmdOpen((open) => !open);
      }

      // Cmd/Ctrl + S for Save
      if ((e.key === "s" || e.key === "S") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        window.dispatchEvent(new Event("save-shortcut"));
      }

      // Cmd/Ctrl + P for Print (we prevent default to handle custom PDF generation where applicable)
      if ((e.key === "p" || e.key === "P") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        window.dispatchEvent(new Event("print-shortcut"));
      }

      // Sequence 'c' (c then k, c then n)
      if (e.key === "c" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setCPressed(true);
        clearTimeout(cTimeout);
        cTimeout = setTimeout(() => setCPressed(false), 1000);
      } else if (cPressed && !e.ctrlKey && !e.metaKey && !e.altKey) {
        switch (e.key) {
          case "k": 
            e.preventDefault();
            setCmdOpen((open) => !open);
            break;
          case "n": 
            e.preventDefault();
            router.push("/invoices/new");
            break;
        }
        setCPressed(false);
      } else {
        setCPressed(false);
      }

      // Sequence Navigation (g then x)
      if (e.key === "g" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setGPressed(true);
        clearTimeout(gTimeout);
        gTimeout = setTimeout(() => setGPressed(false), 1000); // 1 second window
      } else if (gPressed && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // We are in the sequence window
        switch (e.key) {
          case "d": router.push("/"); break;
          case "i": router.push("/invoices"); break;
          case "h": router.push("/payments"); break;
          case "c": router.push("/customers"); break;
          case "v": router.push("/vehicles"); break;
          case "p": router.push("/inventory"); break;
          case "e": router.push("/expenses"); break;
          case "s": router.push("/settings"); break;
        }
        setGPressed(false); // Reset after action
      } else {
        // Any other key resets 'g' sequence
        setGPressed(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      clearTimeout(gTimeout);
      clearTimeout(cTimeout);
    };
  }, [router, gPressed, cPressed]);

  // Listen for the custom event to open shortcuts modal
  useEffect(() => {
    const handleOpenShortcuts = () => setShortcutsOpen(true);
    window.addEventListener("open-shortcuts-modal", handleOpenShortcuts);
    return () => window.removeEventListener("open-shortcuts-modal", handleOpenShortcuts);
  }, []);

  return (
    <>
      <CommandPalette open={cmdOpen} setOpen={setCmdOpen} />
      <ShortcutsModal open={shortcutsOpen} setOpen={setShortcutsOpen} />
    </>
  );
}
