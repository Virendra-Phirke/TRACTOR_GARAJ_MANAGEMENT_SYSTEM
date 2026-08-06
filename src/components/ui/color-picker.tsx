"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, ChevronDown } from "lucide-react";

// ---------- color math ----------

type RGB = { r: number; g: number; b: number };
type HSV = { h: number; s: number; v: number };

function hsvToRgb(h: number, s: number, v: number): RGB {
  s = s / 100;
  v = v / 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function rgbToHsv(r: number, g: number, b: number): HSV {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  if (h < 0) h += 360;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return { h, s: s * 100, v: v * 100 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) =>
        Math.round(Math.max(0, Math.min(255, x)))
          .toString(16)
          .padStart(2, "0")
      )
      .join("")
      .toUpperCase()
  );
}

function hexToRgb(hex: string): RGB | null {
  const clean = hex.replace("#", "").trim();
  if (!/^[0-9A-Fa-f]{6}$/.test(clean)) return null;
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

type DragTarget = "square" | "hue" | "alpha" | null;

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  onClose?: () => void;
  showAlpha?: boolean;
}

export default function ColorPicker({ value, onChange, onClose, showAlpha = false }: ColorPickerProps) {
  // Initialize from value prop
  const getInitialHsv = () => {
    const rgb = hexToRgb(value || "#888888") || { r: 136, g: 136, b: 136 };
    return rgbToHsv(rgb.r, rgb.g, rgb.b);
  };
  
  const initial = getInitialHsv();
  const [hue, setHue] = useState(initial.h);
  const [saturation, setSaturation] = useState(initial.s);
  const [valueHsv, setValueHsv] = useState(initial.v);
  const [alpha, setAlpha] = useState(100);
  const [hexDraft, setHexDraft] = useState("");
  const [alphaDraft, setAlphaDraft] = useState("100");

  const squareRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const alphaRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<DragTarget>(null);

  const rgb = hsvToRgb(hue, saturation, valueHsv);
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  const pureHueRgb = hsvToRgb(hue, 100, 100);

  // Update internal hexDraft when hex changes
  useEffect(() => {
    setHexDraft(hex);
  }, [hex]);
  
  useEffect(() => {
    setAlphaDraft(String(Math.round(alpha)));
  }, [alpha]);

  // Sync back external changes if they differ from current state
  // We only want to update if it's a valid hex and different from current hex
  useEffect(() => {
    // Prevent updating internal HSV if we are actively dragging, 
    // to avoid hue-loss when dragging through grays/blacks
    if (dragging.current !== null) return;
    
    if (value && value.toUpperCase() !== hex) {
       const rgb = hexToRgb(value);
       if (rgb) {
          const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
          setHue(hsv.h);
          setSaturation(hsv.s);
          setValueHsv(hsv.v);
       }
    }
  }, [value, hex]);

  const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

  const updateSquare = useCallback((clientX: number, clientY: number) => {
    const el = squareRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clamp01((clientX - rect.left) / rect.width);
    const y = clamp01((clientY - rect.top) / rect.height);
    
    const newS = x * 100;
    const newV = (1 - y) * 100;
    setSaturation(newS);
    setValueHsv(newV);
    
    // Fire onChange immediately
    const newRgb = hsvToRgb(hue, newS, newV);
    onChange(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  }, [hue, onChange]);

  const updateHue = useCallback((clientX: number) => {
    const el = hueRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clamp01((clientX - rect.left) / rect.width);
    
    const newH = x * 360;
    setHue(newH);
    
    const newRgb = hsvToRgb(newH, saturation, valueHsv);
    onChange(rgbToHex(newRgb.r, newRgb.g, newRgb.b));
  }, [saturation, valueHsv, onChange]);

  const updateAlpha = useCallback((clientX: number) => {
    const el = alphaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clamp01((clientX - rect.left) / rect.width);
    setAlpha(x * 100);
  }, []);

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (dragging.current === "square") updateSquare(e.clientX, e.clientY);
      else if (dragging.current === "hue") updateHue(e.clientX);
      else if (dragging.current === "alpha") updateAlpha(e.clientX);
    };
    const handleUp = () => {
      dragging.current = null;
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [updateSquare, updateHue, updateAlpha]);

  const commitHex = (raw: string) => {
    const parsed = hexToRgb(raw);
    if (parsed) {
      const hsv = rgbToHsv(parsed.r, parsed.g, parsed.b);
      setHue(hsv.h);
      setSaturation(hsv.s);
      setValueHsv(hsv.v);
      const newHex = rgbToHex(parsed.r, parsed.g, parsed.b);
      onChange(newHex);
      setHexDraft(newHex);
    } else {
      setHexDraft(hex);
    }
  };

  const commitAlpha = (raw: string) => {
    const n = parseInt(raw.replace("%", "").trim(), 10);
    if (!isNaN(n)) setAlpha(clamp01(n / 100) * 100);
    else setAlphaDraft(String(Math.round(alpha)));
  };

  const handleSize = 18;

  return (
    <div
      className="cp-root w-full max-w-[340px]"
      style={{
        background: "#232326",
        borderRadius: 20,
        padding: 24,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: "#fff",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}
    >
      <style>{`.cp-root, .cp-root * { box-sizing: border-box; }
        .cp-root button { -webkit-tap-highlight-color: transparent; }
        .cp-root input::selection { background: rgba(167,139,250,0.4); }`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 22 }}>
        <span
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "#A78BFA",
            flex: 1,
          }}
        >
          Solid
        </span>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "rgba(255,255,255,0.6)",
              display: "flex",
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Saturation / Value square */}
      <div
        ref={squareRef}
        onPointerDown={(e) => {
          dragging.current = "square";
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          updateSquare(e.clientX, e.clientY);
        }}
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1 / 1",
          borderRadius: 14,
          cursor: "crosshair",
          touchAction: "none",
          background: `linear-gradient(to top, #000, transparent),
                       linear-gradient(to right, #fff, transparent),
                       rgb(${pureHueRgb.r}, ${pureHueRgb.g}, ${pureHueRgb.b})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: `${saturation}%`,
            top: `${100 - valueHsv}%`,
            width: handleSize,
            height: handleSize,
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            border: "2.5px solid #fff",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.3), 0 2px 5px rgba(0,0,0,0.45)",
            background: hex,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Hue slider */}
      <div
        ref={hueRef}
        onPointerDown={(e) => {
          dragging.current = "hue";
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          updateHue(e.clientX);
        }}
        style={{
          position: "relative",
          width: "100%",
          height: 10,
          borderRadius: 999,
          marginTop: 18,
          cursor: "pointer",
          touchAction: "none",
          background:
            "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: `${(hue / 360) * 100}%`,
            top: "50%",
            width: 20,
            height: 20,
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            border: "2.5px solid #fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.5)",
            background: `rgb(${pureHueRgb.r}, ${pureHueRgb.g}, ${pureHueRgb.b})`,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Alpha slider - optional */}
      {showAlpha && (
        <div
          ref={alphaRef}
          onPointerDown={(e) => {
            dragging.current = "alpha";
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            updateAlpha(e.clientX);
          }}
          style={{
            position: "relative",
            width: "100%",
            height: 10,
            borderRadius: 999,
            marginTop: 14,
            cursor: "pointer",
            touchAction: "none",
            overflow: "hidden",
            backgroundImage:
              "linear-gradient(45deg, #4b4b4b 25%, transparent 25%), linear-gradient(-45deg, #4b4b4b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #4b4b4b 75%), linear-gradient(-45deg, transparent 75%, #4b4b4b 75%)",
            backgroundSize: "10px 10px",
            backgroundPosition: "0 0, 0 5px, 5px -5px, -5px 0px",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(to right, transparent, rgb(${rgb.r}, ${rgb.g}, ${rgb.b}))`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: `${alpha}%`,
              top: "50%",
              width: 20,
              height: 20,
              borderRadius: "50%",
              transform: "translate(-50%, -50%)",
              border: "2.5px solid #fff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.5)",
              background: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha / 100})`,
              pointerEvents: "none",
            }}
          />
        </div>
      )}

      {/* Hex + opacity row */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 22 }}>
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.55)",
            fontSize: 14,
            padding: 0,
            flexShrink: 0,
          }}
        >
          Hex <ChevronDown size={14} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          <span
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: hex,
              flexShrink: 0,
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          />
          <input
            value={hexDraft}
            onChange={(e) => setHexDraft(e.target.value.toUpperCase())}
            onBlur={(e) => commitHex(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                commitHex((e.target as HTMLInputElement).value);
                (e.target as HTMLInputElement).blur();
              }
            }}
            spellCheck={false}
            style={{
              background: "none",
              border: "none",
              outline: "none",
              color: "#fff",
              fontSize: 14,
              fontFamily: "inherit",
              width: "100%",
              minWidth: 0,
            }}
          />
        </div>

        {showAlpha && (
          <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <input
              value={alphaDraft}
              onChange={(e) => setAlphaDraft(e.target.value.replace(/[^0-9]/g, ""))}
              onBlur={(e) => commitAlpha(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  commitAlpha((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).blur();
                }
              }}
              style={{
                background: "none",
                border: "none",
                outline: "none",
                color: "#fff",
                fontSize: 14,
                fontFamily: "inherit",
                width: 30,
                textAlign: "right",
              }}
            />
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>%</span>
          </div>
        )}
      </div>
    </div>
  );
}
