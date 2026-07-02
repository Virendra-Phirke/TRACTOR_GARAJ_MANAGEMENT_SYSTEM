"use client"

import { useTheme } from "@/components/theme-provider"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-5 text-emerald-500" />
        ),
        info: (
          <InfoIcon className="size-5 text-blue-500" />
        ),
        warning: (
          <TriangleAlertIcon className="size-5 text-amber-500" />
        ),
        error: (
          <OctagonXIcon className="size-5 text-red-500" />
        ),
        loading: (
          <Loader2Icon className="size-5 animate-spin" />
        ),
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border shadow-lg p-4 rounded-xl border border-border/50",
          description: "group-[.toast]:text-muted-foreground text-sm",
          title: "font-semibold text-[15px]",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground font-semibold rounded-md px-3 py-1.5 transition-colors hover:group-[.toast]:bg-primary/90 cursor-pointer shadow-sm",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground font-semibold rounded-md px-3 py-1.5 transition-colors hover:group-[.toast]:bg-muted/80 cursor-pointer",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
