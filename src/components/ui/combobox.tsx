"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ComboboxProps {
  options: { value: string; label: string }[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
  allowCustomValue?: boolean
}

export function Combobox({
  options = [],
  value,
  onChange,
  placeholder = "Type to search...",
  emptyText = "No option found.",
  className,
  disabled = false,
  allowCustomValue = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const [highlightIndex, setHighlightIndex] = React.useState(-1)
  const [dropdownPos, setDropdownPos] = React.useState<{ top: number; left: number; width: number } | null>(null)
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  // Derive display text from current value
  const displayLabel = React.useMemo(() => {
    if (!value) return ""
    return options.find((o) => o.value === value)?.label || value
  }, [value, options])

  const [prevValue, setPrevValue] = React.useState(value)
  
  if (value !== prevValue) {
    setPrevValue(value)
    if (!open) {
      setInputValue(displayLabel)
    }
  }

  // Filter options based on input
  const filtered = React.useMemo(() => {
    if (!inputValue) return options
    const q = inputValue.toLowerCase()
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, inputValue])

  // Check if there's an exact match for custom value
  const hasExactMatch = React.useMemo(() => {
    return options.some((o) => o.label.toLowerCase() === inputValue.toLowerCase())
  }, [options, inputValue])

  // Position dropdown relative to input using a portal
  const updatePosition = React.useCallback(() => {
    if (!inputRef.current) return
    const rect = inputRef.current.getBoundingClientRect()
    setDropdownPos({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width,
    })
  }, [])

  // Recalculate on open and scroll/resize
  React.useEffect(() => {
    if (!open) return
    updatePosition()

    const handleReposition = () => updatePosition()
    window.addEventListener("scroll", handleReposition, true)
    window.addEventListener("resize", handleReposition)
    return () => {
      window.removeEventListener("scroll", handleReposition, true)
      window.removeEventListener("resize", handleReposition)
    }
  }, [open, updatePosition])

  // Close on outside click (check both wrapper and portal list)
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        wrapperRef.current && !wrapperRef.current.contains(target) &&
        listRef.current && !listRef.current.contains(target)
      ) {
        setOpen(false)
        setInputValue(displayLabel)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [displayLabel])

  // Scroll highlighted item into view
  React.useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-combobox-item]")
      items[highlightIndex]?.scrollIntoView({ block: "nearest" })
    }
  }, [highlightIndex])

  const selectOption = (opt: { value: string; label: string }) => {
    onChange(opt.value)
    setInputValue(opt.label)
    setOpen(false)
    setHighlightIndex(-1)
    inputRef.current?.blur()
  }

  const selectCustom = (text: string) => {
    onChange(text)
    setInputValue(text)
    setOpen(false)
    setHighlightIndex(-1)
    inputRef.current?.blur()
  }

  const clearValue = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange("")
    setInputValue("")
    setHighlightIndex(-1)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = filtered.length + (allowCustomValue && inputValue && !hasExactMatch ? 1 : 0)

    if (e.key === "ArrowDown") {
      e.preventDefault()
      if (!open) { setOpen(true); return }
      setHighlightIndex((prev) => (prev + 1) % totalItems)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (!open) { setOpen(true); return }
      setHighlightIndex((prev) => (prev - 1 + totalItems) % totalItems)
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (!open) { setOpen(true); return }
      const showCustom = allowCustomValue && inputValue && !hasExactMatch
      if (showCustom && highlightIndex === 0) {
        selectCustom(inputValue)
      } else {
        const filteredIndex = showCustom ? highlightIndex - 1 : highlightIndex
        if (filteredIndex >= 0 && filteredIndex < filtered.length) {
          selectOption(filtered[filteredIndex])
        } else if (allowCustomValue && inputValue) {
          selectCustom(inputValue)
        }
      }
    } else if (e.key === "Escape") {
      setOpen(false)
      setInputValue(displayLabel)
      inputRef.current?.blur()
    } else if (e.key === "Tab") {
      setOpen(false)
      setInputValue(displayLabel)
    }
  }

  // Render dropdown via portal to avoid overflow/clipping issues
  const dropdownContent = open && !disabled && dropdownPos ? createPortal(
    <div
      ref={listRef}
      style={{
        position: "absolute",
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: dropdownPos.width,
        zIndex: 9999,
      }}
      className={cn(
        "rounded-md border bg-popover p-1 text-popover-foreground shadow-lg",
        "max-h-60 overflow-y-auto",
        "animate-in fade-in-0 zoom-in-95"
      )}
    >
      {/* Custom value option */}
      {allowCustomValue && inputValue && !hasExactMatch && (
        <div
          data-combobox-item
          onClick={() => selectCustom(inputValue)}
          className={cn(
            "relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm select-none transition-colors",
            highlightIndex === 0
              ? "bg-accent text-accent-foreground"
              : "hover:bg-accent/50"
          )}
        >
          <span className="font-medium text-primary">Use &quot;{inputValue}&quot;</span>
        </div>
      )}

      {/* Filtered options */}
      {filtered.length > 0 ? (
        filtered.map((opt, i) => {
          const itemIndex = (allowCustomValue && inputValue && !hasExactMatch) ? i + 1 : i
          return (
            <div
              key={opt.value}
              data-combobox-item
              onClick={() => selectOption(opt)}
              className={cn(
                "relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm select-none transition-colors",
                highlightIndex === itemIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              )}
            >
              <Check
                className={cn(
                  "h-4 w-4 shrink-0",
                  value === opt.value ? "opacity-100 text-primary" : "opacity-0"
                )}
              />
              <span>{opt.label}</span>
            </div>
          )
        })
      ) : (
        !allowCustomValue || !inputValue ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            {emptyText}
          </div>
        ) : null
      )}
    </div>,
    document.body
  ) : null

  return (
    <div ref={wrapperRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          disabled={disabled}
          value={inputValue}
          placeholder={placeholder}
          onFocus={() => {
            setOpen(true)
            setHighlightIndex(-1)
            if (inputValue) {
              setTimeout(() => inputRef.current?.select(), 0)
            }
          }}
          onChange={(e) => {
            setInputValue(e.target.value)
            setOpen(true)
            setHighlightIndex(-1)
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pr-8 text-sm shadow-xs transition-colors",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        />
        {value && !disabled && (
          <button
            type="button"
            onClick={clearValue}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {dropdownContent}
    </div>
  )
}
