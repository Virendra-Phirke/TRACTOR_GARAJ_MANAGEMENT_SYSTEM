"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Trash2, Plus, Save, X, Eye, Move, Type, Square, QrCode,
  Table2, Calculator, User, Phone, MapPin, Hash, Calendar,
  Truck, FileText, ChevronUp, ChevronDown, Layers, GripVertical,
  Copy, RotateCcw, PanelRightClose, PanelRightOpen, GripHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { updateCustomLayout } from "@/lib/actions/settings";

export type CustomElementType = "text" | "dynamic" | "table" | "totals" | "qr" | "box";

export interface CustomElement {
  id: string;
  type: CustomElementType;
  x: number;
  y: number;
  w: number;
  h: number;
  text?: string;
  dynamicField?: string;
  fontSize?: number;
  bold?: boolean;
}

const A4_WIDTH = 595;
const A4_HEIGHT = 842;

// Sample preview data so the user sees realistic content while building
const SAMPLE_DATA: Record<string, string> = {
  garageName: "Phirke Tractor Garage",
  garageAddress: "Gat No. 123, Pune - Nashik Highway, Pune 412108",
  invoiceNumber: "INV-20260702175841",
  invoiceDate: "02 Jul 2026, 07:15 PM",
  customerName: "Rajesh Kumar Patil",
  customerPhone: "+91 98765 43210",
  vehicleBrandModel: "Mahindra 575 DI",
  vehicleReg: "MH-12-AB-1234",
};

// Grouped dynamic fields for the palette
const FIELD_GROUPS = [
  {
    label: "Garage Info",
    icon: MapPin,
    fields: [
      { key: "garageName", label: "Garage Name", icon: FileText },
      { key: "garageAddress", label: "Address", icon: MapPin },
    ],
  },
  {
    label: "Invoice Info",
    icon: Hash,
    fields: [
      { key: "invoiceNumber", label: "Invoice #", icon: Hash },
      { key: "invoiceDate", label: "Date", icon: Calendar },
    ],
  },
  {
    label: "Customer",
    icon: User,
    fields: [
      { key: "customerName", label: "Name", icon: User },
      { key: "customerPhone", label: "Phone", icon: Phone },
    ],
  },
  {
    label: "Vehicle",
    icon: Truck,
    fields: [
      { key: "vehicleBrandModel", label: "Brand & Model", icon: Truck },
      { key: "vehicleReg", label: "Reg No", icon: Hash },
    ],
  },
  {
    label: "Tables & Totals",
    icon: Table2,
    fields: [
      { key: "table_labor", label: "Labor Table", icon: Table2 },
      { key: "table_parts", label: "Parts Table", icon: Table2 },
      { key: "totals", label: "Totals Box", icon: Calculator },
      { key: "qr", label: "Payment QR", icon: QrCode },
    ],
  },
];

const DYNAMIC_FIELDS: Record<string, string> = {};
FIELD_GROUPS.forEach((g) => g.fields.forEach((f) => { DYNAMIC_FIELDS[f.key] = f.label; }));

// Render realistic inline preview for each element type on the canvas
function CanvasElementContent({ el }: { el: CustomElement }) {
  if (el.type === "text") {
    return <span className="text-gray-900">{el.text || "Text"}</span>;
  }

  if (el.type === "dynamic") {
    const sample = SAMPLE_DATA[el.dynamicField || ""] || `[${DYNAMIC_FIELDS[el.dynamicField || ""] || "Field"}]`;
    return <span className="text-gray-800">{sample}</span>;
  }

  if (el.type === "table") {
    const isLabor = el.dynamicField === "table_labor";
    const title = isLabor ? "LABOR CHARGES" : "SPARE PARTS";
    const rows = isLabor
      ? [
          { desc: "General Servicing", qty: "2 hrs", amt: "₹1,000" },
          { desc: "Engine Tuning", qty: "1 hr", amt: "₹800" },
        ]
      : [
          { desc: "Engine Oil (5L)", qty: "×1", amt: "₹1,200" },
          { desc: "Oil Filter", qty: "×1", amt: "₹350" },
        ];
    return (
      <div className="w-full h-full flex flex-col text-[9px] leading-[13px] overflow-hidden">
        <div className="font-bold text-emerald-700 border-b border-gray-300 pb-0.5 mb-0.5 text-[8px] uppercase tracking-wider">{title}</div>
        <div className="flex justify-between text-[7px] text-gray-400 font-semibold uppercase border-b border-gray-200 pb-0.5 mb-0.5">
          <span>Description</span><span>Amount</span>
        </div>
        {rows.map((r, i) => (
          <div key={i} className="flex justify-between text-gray-700 py-px">
            <span className="truncate flex-1">{r.desc} <span className="text-gray-400 text-[7px]">({r.qty})</span></span>
            <span className="font-medium ml-2 whitespace-nowrap">{r.amt}</span>
          </div>
        ))}
        <div className="border-t border-gray-300 mt-auto pt-0.5 flex justify-between font-bold text-gray-900">
          <span>Total</span>
          <span>{isLabor ? "₹1,800" : "₹1,550"}</span>
        </div>
      </div>
    );
  }

  if (el.type === "totals") {
    return (
      <div className="w-full h-full flex flex-col text-[9px] leading-[14px] justify-center overflow-hidden">
        <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>₹3,350.00</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Tax (18%)</span><span>₹603.00</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Discount</span><span className="text-red-500">-₹150.00</span></div>
        <div className="border-t border-gray-400 mt-1 pt-1 flex justify-between font-bold text-emerald-700 text-[10px]">
          <span>GRAND TOTAL</span><span>₹3,803.00</span>
        </div>
      </div>
    );
  }

  if (el.type === "qr") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-0.5 bg-gray-50 rounded">
        {/* Simple QR placeholder grid */}
        <div className="grid grid-cols-5 gap-[2px]">
          {Array.from({ length: 25 }).map((_, i) => (
            <div key={i} className={`w-[5px] h-[5px] rounded-[1px] ${[0,1,2,4,5,6,8,10,14,16,18,20,22,23,24].includes(i) ? "bg-gray-800" : "bg-white border border-gray-200"}`} />
          ))}
        </div>
        <span className="text-[7px] text-gray-400 font-medium">Scan to Pay</span>
      </div>
    );
  }

  if (el.type === "box") {
    return <div className="w-full h-full border border-gray-800 rounded-[1px]" />;
  }

  return null;
}

export function LayoutEditor({
  initialConfig,
  onClose,
}: {
  initialConfig: any;
  onClose: () => void;
}) {
  const [elements, setElements] = useState<CustomElement[]>(
    initialConfig?.elements || []
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"add" | "layers">("add");
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [previewWidth, setPreviewWidth] = useState(420);
  const [isDraggingDivider, setIsDraggingDivider] = useState(false);
  const dividerStartX = useRef(0);
  const dividerStartW = useRef(0);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [elStart, setElStart] = useState({ x: 0, y: 0 });

  // ─── Resize state ──────────────────────────────────────────────────
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0 });

  // ─── Drag logic ────────────────────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedId(id);
    setDraggingId(id);
    setDragStart({ x: e.clientX, y: e.clientY });
    const el = elements.find((el) => el.id === id);
    if (el) setElStart({ x: el.x, y: el.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingId) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setElements((prev) =>
        prev.map((el) =>
          el.id === draggingId
            ? { ...el, x: Math.max(0, Math.min(A4_WIDTH - el.w, elStart.x + dx)), y: Math.max(0, Math.min(A4_HEIGHT - el.h, elStart.y + dy)) }
            : el
        )
      );
    }
    if (resizingId) {
      const dx = e.clientX - resizeStart.x;
      const dy = e.clientY - resizeStart.y;
      setElements((prev) =>
        prev.map((el) =>
          el.id === resizingId
            ? { ...el, w: Math.max(30, resizeStart.w + dx), h: Math.max(15, resizeStart.h + dy) }
            : el
        )
      );
    }
  };

  const handleMouseUp = () => {
    setDraggingId(null);
    setResizingId(null);
  };

  // ─── Resize handle ────────────────────────────────────────────────
  const handleResizeStart = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const el = elements.find((el) => el.id === id);
    if (!el) return;
    setResizingId(id);
    setSelectedId(id);
    setResizeStart({ x: e.clientX, y: e.clientY, w: el.w, h: el.h });
  };

  // ─── CRUD ──────────────────────────────────────────────────────────
  const addElement = (type: CustomElementType, dynamicField?: string) => {
    const newEl: CustomElement = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: 30,
      y: 30 + elements.length * 30,
      w: type === "table" ? 520 : type === "totals" ? 220 : type === "qr" ? 80 : type === "box" ? 520 : 250,
      h: type === "table" ? 120 : type === "totals" ? 90 : type === "qr" ? 80 : type === "box" ? 1 : 22,
      text: type === "text" ? "New Text" : undefined,
      dynamicField,
      fontSize: type === "text" ? 12 : 11,
      bold: false,
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
    setSidebarTab("layers");
  };

  const updateSelected = (updates: Partial<CustomElement>) => {
    if (!selectedId) return;
    setElements((prev) => prev.map((el) => (el.id === selectedId ? { ...el, ...updates } : el)));
  };

  const deleteElement = (id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const duplicateElement = (id: string) => {
    const el = elements.find((e) => e.id === id);
    if (!el) return;
    const dup: CustomElement = { ...el, id: Math.random().toString(36).substr(2, 9), x: el.x + 15, y: el.y + 15 };
    setElements([...elements, dup]);
    setSelectedId(dup.id);
  };

  const moveLayer = (id: string, direction: "up" | "down") => {
    setElements((prev) => {
      const idx = prev.findIndex((e) => e.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const swap = direction === "up" ? idx + 1 : idx - 1;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  };

  const clearAll = () => {
    setElements([]);
    setSelectedId(null);
  };

  // ─── Save ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await updateCustomLayout({ elements });
      if (res.success) {
        toast.success("Custom layout saved!");
        onClose();
      } else {
        toast.error("Failed to save layout");
      }
    } catch {
      toast.error("Error saving layout");
    }
    setIsSaving(false);
  };

  // ─── Live Preview ──────────────────────────────────────────────────
  const handlePreview = async () => {
    setIsPreviewLoading(true);
    try {
      // Save the current layout first so the preview API can use it
      await updateCustomLayout({ elements });
      // Fetch the PDF as a blob and create an object URL for the iframe
      const res = await fetch(`/api/preview-invoice?format=custom_layout&_t=${Date.now()}`);
      if (!res.ok) throw new Error("Failed to fetch preview");
      const blob = await res.blob();
      // Revoke old URL if any
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setShowPreview(true);
    } catch {
      toast.error("Failed to generate preview");
    }
    setIsPreviewLoading(false);
  };

  const selectedEl = elements.find((e) => e.id === selectedId);

  // ─── Helper: type badge color ──────────────────────────────────────
  const typeBadge = (type: CustomElementType) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      text: { bg: "bg-amber-500/20", text: "text-amber-400", label: "Text" },
      dynamic: { bg: "bg-sky-500/20", text: "text-sky-400", label: "Dynamic" },
      table: { bg: "bg-violet-500/20", text: "text-violet-400", label: "Table" },
      totals: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "Totals" },
      qr: { bg: "bg-pink-500/20", text: "text-pink-400", label: "QR" },
      box: { bg: "bg-gray-500/20", text: "text-gray-400", label: "Line/Box" },
    };
    const m = map[type] || map.text;
    return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${m.bg} ${m.text}`}>{m.label}</span>;
  };

  // ─── Element name for layers ───────────────────────────────────────
  const elementName = (el: CustomElement) => {
    if (el.type === "text") return el.text?.substring(0, 20) || "Text";
    if (el.type === "dynamic") return DYNAMIC_FIELDS[el.dynamicField || ""] || "Field";
    if (el.type === "table") return el.dynamicField === "table_labor" ? "Labor Table" : "Parts Table";
    if (el.type === "totals") return "Totals Box";
    if (el.type === "qr") return "Payment QR";
    if (el.type === "box") return "Line / Box";
    return "Element";
  };

  // ─── Divider drag for preview resize ─────────────────────────────
  const handleDividerDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingDivider(true);
    dividerStartX.current = e.clientX;
    dividerStartW.current = previewWidth;
    const onMove = (ev: MouseEvent) => {
      const dx = dividerStartX.current - ev.clientX;
      setPreviewWidth(Math.max(280, Math.min(700, dividerStartW.current + dx)));
    };
    const onUp = () => {
      setIsDraggingDivider(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-background text-foreground border border-border rounded-xl shadow-2xl w-full max-w-[100vw] h-[100vh] sm:max-w-[96vw] sm:h-[94vh] flex flex-col overflow-hidden">

        {/* ═══ HEADER ═══ */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold leading-tight">Invoice Layout Builder</h2>
              <p className="text-[10px] text-muted-foreground">Drag elements • Resize from corners • Click to edit</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground gap-1 text-[11px] h-7 px-2">
              <RotateCcw className="w-3 h-3" /> Clear
            </Button>
            <div className="w-px h-4 bg-border" />
            <Button
              variant={showPreview ? "default" : "secondary"}
              size="sm"
              className="gap-1 text-[11px] h-7 px-2.5"
              onClick={handlePreview}
              disabled={isPreviewLoading}
            >
              <Eye className="w-3 h-3" /> {isPreviewLoading ? "..." : showPreview ? "Refresh" : "Preview"}
            </Button>
            {showPreview && (
              <Button variant="ghost" size="sm" className="gap-1 text-[11px] h-7 px-2 text-muted-foreground" onClick={() => setShowPreview(false)}>
                <X className="w-3 h-3" /> Close
              </Button>
            )}
            <div className="w-px h-4 bg-border" />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowSidebar(!showSidebar)} title={showSidebar ? "Hide panel" : "Show panel"}>
              {showSidebar ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
            </Button>
            <div className="w-px h-4 bg-border" />
            <Button variant="outline" size="sm" className="gap-1 text-[11px] h-7 px-2.5" onClick={onClose}>
              <X className="w-3 h-3" /> Cancel
            </Button>
            <Button size="sm" className="gap-1 text-[11px] h-7 px-2.5" onClick={handleSave} disabled={isSaving}>
              <Save className="w-3 h-3" /> {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* ═══ CANVAS AREA ═══ */}
          <div
            className="flex-1 overflow-auto flex items-start justify-center p-6 relative select-none"
            style={{ background: "repeating-conic-gradient(hsl(var(--muted)) 0% 25%, transparent 0% 50%) 50% / 24px 24px" }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={() => setSelectedId(null)}
          >
            {/* A4 Page */}
            <div
              ref={canvasRef}
              className="bg-white shadow-xl rounded-sm relative text-black"
              style={{ width: A4_WIDTH, height: A4_HEIGHT, minWidth: A4_WIDTH, minHeight: A4_HEIGHT }}
            >
              {/* Rulers */}
              <div className="absolute -top-4 left-0 right-0 h-3 flex items-end">
                {[0, 100, 200, 300, 400, 500].map((v) => (
                  <span key={v} className="absolute text-[8px] text-muted-foreground/60 font-mono" style={{ left: v }}>{v}</span>
                ))}
              </div>
              <div className="absolute -left-5 top-0 bottom-0 w-4 flex flex-col">
                {[0, 100, 200, 300, 400, 500, 600, 700, 800].map((v) => (
                  <span key={v} className="absolute text-[8px] text-muted-foreground/60 font-mono" style={{ top: v }}>{v}</span>
                ))}
              </div>

              {/* Empty state */}
              {elements.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 pointer-events-none">
                  <Layers className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm font-medium">Empty Canvas</p>
                  <p className="text-xs">{showSidebar ? "Add elements from the right panel →" : "Click the panel toggle in the header"}</p>
                </div>
              )}

              {/* Elements */}
              {elements.map((el) => {
                const isSelected = selectedId === el.id;
                return (
                  <div
                    key={el.id}
                    onMouseDown={(e) => handleMouseDown(e, el.id)}
                    onClick={(e) => { e.stopPropagation(); setSelectedId(el.id); }}
                    className={`absolute group transition-shadow duration-100 ${
                      isSelected
                        ? "ring-2 ring-blue-500 shadow-lg shadow-blue-500/10 z-20"
                        : "hover:ring-1 hover:ring-blue-300/60 z-10"
                    } ${draggingId === el.id ? "cursor-grabbing opacity-90" : "cursor-grab"}`}
                    style={{
                      left: el.x,
                      top: el.y,
                      width: el.w,
                      height: el.h,
                      fontWeight: el.bold ? "bold" : "normal",
                      fontSize: el.fontSize ? `${el.fontSize}px` : "12px",
                    }}
                  >
                    {/* Grab handle */}
                    <div className={`absolute -top-4 left-0 right-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isSelected ? "opacity-100" : ""}`}>
                      <div className="bg-blue-500 text-white text-[8px] px-1.5 py-0.5 rounded-sm flex items-center gap-0.5 shadow-md">
                        <Move className="w-2.5 h-2.5" />
                        {elementName(el).substring(0, 18)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className={`w-full h-full overflow-hidden flex items-center px-1.5 ${
                      el.type === "table" || el.type === "totals" || el.type === "qr" ? "p-2 items-start" : ""
                    } ${
                      isSelected ? "bg-blue-50/50" : "bg-white/80"
                    } border ${
                      isSelected ? "border-blue-400" : "border-dashed border-gray-200"
                    } rounded-[2px]`}>
                      <CanvasElementContent el={el} />
                    </div>

                    {/* Resize handle */}
                    {isSelected && (
                      <div
                        onMouseDown={(e) => handleResizeStart(e, el.id)}
                        className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-se-resize shadow-md z-30"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══ INLINE PDF PREVIEW (resizable) ═══ */}
          {showPreview && previewUrl && (
            <>
              {/* Drag divider */}
              <div
                onMouseDown={handleDividerDown}
                className={`w-1.5 cursor-col-resize flex items-center justify-center hover:bg-primary/20 transition-colors shrink-0 ${isDraggingDivider ? "bg-primary/30" : "bg-border/50"}`}
              >
                <GripHorizontal className="w-3 h-3 text-muted-foreground rotate-90" />
              </div>
              <div className="flex flex-col bg-muted/10" style={{ width: previewWidth }}>
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card/80 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3 h-3 text-primary" />
                    <span className="text-[11px] font-semibold">Preview</span>
                    <span className="text-[9px] text-muted-foreground">({previewWidth}px)</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="sm" className="h-5 text-[9px] gap-0.5 text-muted-foreground px-1.5" onClick={handlePreview} disabled={isPreviewLoading}>
                      <RotateCcw className="w-2.5 h-2.5" /> {isPreviewLoading ? "..." : "Refresh"}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setShowPreview(false)}>
                      <X className="w-2.5 h-2.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden p-1.5">
                  <iframe
                    src={previewUrl}
                    className="w-full h-full rounded border border-border bg-white"
                    title="Invoice Preview"
                  />
                </div>
              </div>
            </>
          )}

          {/* ═══ RIGHT SIDEBAR (collapsible) ═══ */}
          {showSidebar && (
            <div className="w-[290px] shrink-0 border-l border-border bg-card/50 flex flex-col">

              {/* Sidebar tabs */}
              <div className="flex border-b border-border shrink-0">
                <button
                  onClick={() => setSidebarTab("add")}
                  className={`flex-1 text-[11px] font-medium py-2 transition-colors ${sidebarTab === "add" ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Plus className="w-3 h-3 inline mr-0.5" />Add
                </button>
                <button
                  onClick={() => setSidebarTab("layers")}
                  className={`flex-1 text-[11px] font-medium py-2 transition-colors ${sidebarTab === "layers" ? "text-primary border-b-2 border-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Layers className="w-3 h-3 inline mr-0.5" />Layers ({elements.length})
                </button>
              </div>

              <div className="flex-1 overflow-auto">
                {/* ADD TAB */}
                {sidebarTab === "add" && (
                  <div className="p-2.5 space-y-2.5">
                    <div>
                      <h4 className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Basic</h4>
                      <div className="grid grid-cols-2 gap-1">
                        <button onClick={() => addElement("text")} className="flex items-center gap-1.5 p-2 rounded-lg border border-border/60 hover:bg-accent/40 hover:border-primary/30 transition-all text-left">
                          <div className="w-6 h-6 rounded bg-amber-500/15 flex items-center justify-center shrink-0"><Type className="w-3 h-3 text-amber-500" /></div>
                          <span className="text-[11px] font-medium">Text</span>
                        </button>
                        <button onClick={() => addElement("box")} className="flex items-center gap-1.5 p-2 rounded-lg border border-border/60 hover:bg-accent/40 hover:border-primary/30 transition-all text-left">
                          <div className="w-6 h-6 rounded bg-gray-500/15 flex items-center justify-center shrink-0"><Square className="w-3 h-3 text-gray-400" /></div>
                          <span className="text-[11px] font-medium">Line/Box</span>
                        </button>
                      </div>
                    </div>
                    {FIELD_GROUPS.map((group) => (
                      <div key={group.label}>
                        <h4 className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <group.icon className="w-2.5 h-2.5" />{group.label}
                        </h4>
                        <div className="grid grid-cols-2 gap-1">
                          {group.fields.map((f) => (
                            <button
                              key={f.key}
                              onClick={() => addElement(f.key.startsWith("table") ? "table" : f.key === "totals" ? "totals" : f.key === "qr" ? "qr" : "dynamic", f.key)}
                              className="flex items-center gap-1.5 p-1.5 rounded-lg border border-border/60 hover:bg-accent/40 hover:border-primary/30 transition-all text-left"
                            >
                              <f.icon className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span className="text-[11px]">{f.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* LAYERS TAB */}
                {sidebarTab === "layers" && (
                  <div className="p-1.5 space-y-0.5">
                    {elements.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Layers className="w-6 h-6 mx-auto mb-1.5 opacity-20" />
                        <p className="text-[11px]">No elements yet</p>
                      </div>
                    )}
                    {[...elements].reverse().map((el) => {
                      const isActive = selectedId === el.id;
                      return (
                        <div
                          key={el.id}
                          onClick={() => setSelectedId(el.id)}
                          className={`flex items-center gap-1.5 p-1.5 rounded-lg cursor-pointer transition-colors ${
                            isActive ? "bg-primary/10 border border-primary/30" : "hover:bg-accent/30 border border-transparent"
                          }`}
                        >
                          <GripVertical className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                          {typeBadge(el.type)}
                          <span className="text-[11px] flex-1 truncate">{elementName(el)}</span>
                          {isActive && (
                            <div className="flex items-center gap-px">
                              <button onClick={(e) => { e.stopPropagation(); moveLayer(el.id, "up"); }} className="p-0.5 rounded hover:bg-accent"><ChevronUp className="w-3 h-3 text-muted-foreground" /></button>
                              <button onClick={(e) => { e.stopPropagation(); moveLayer(el.id, "down"); }} className="p-0.5 rounded hover:bg-accent"><ChevronDown className="w-3 h-3 text-muted-foreground" /></button>
                              <button onClick={(e) => { e.stopPropagation(); duplicateElement(el.id); }} className="p-0.5 rounded hover:bg-accent"><Copy className="w-3 h-3 text-muted-foreground" /></button>
                              <button onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }} className="p-0.5 rounded hover:bg-destructive/10"><Trash2 className="w-3 h-3 text-destructive" /></button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* PROPERTIES PANEL (bottom) */}
              <div className="border-t border-border bg-card/80 shrink-0">
                {selectedEl ? (
                  <div className="p-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {typeBadge(selectedEl.type)}
                        <span className="text-[11px] font-semibold">{elementName(selectedEl)}</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => duplicateElement(selectedEl.id)} title="Duplicate"><Copy className="w-3 h-3 text-muted-foreground" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deleteElement(selectedEl.id)} title="Delete"><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </div>
                    {selectedEl.type === "text" && (
                      <div className="space-y-0.5">
                        <Label className="text-[9px] text-muted-foreground uppercase">Content</Label>
                        <Input className="h-7 text-[11px]" value={selectedEl.text || ""} onChange={(e) => updateSelected({ text: e.target.value })} placeholder="Enter text..." />
                      </div>
                    )}
                    <div>
                      <Label className="text-[9px] text-muted-foreground uppercase">Position & Size</Label>
                      <div className="grid grid-cols-4 gap-1 mt-0.5">
                        {(["x", "y", "w", "h"] as const).map((k) => (
                          <div key={k}>
                            <span className="text-[8px] text-muted-foreground uppercase">{k}</span>
                            <Input className="h-6 text-[11px]" type="number" value={selectedEl[k]} onChange={(e) => updateSelected({ [k]: parseInt(e.target.value) || 0 })} />
                          </div>
                        ))}
                      </div>
                    </div>
                    {(selectedEl.type === "text" || selectedEl.type === "dynamic") && (
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1">
                          <span className="text-[8px] text-muted-foreground uppercase">Font Size</span>
                          <Input className="h-6 text-[11px]" type="number" value={selectedEl.fontSize || 12} onChange={(e) => updateSelected({ fontSize: parseInt(e.target.value) || 12 })} />
                        </div>
                        <button
                          onClick={() => updateSelected({ bold: !selectedEl.bold })}
                          className={`mt-3 h-6 w-6 rounded border text-[11px] font-bold flex items-center justify-center transition-colors ${
                            selectedEl.bold ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-accent"
                          }`}
                        >B</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 text-center text-muted-foreground">
                    <Move className="w-4 h-4 mx-auto mb-1 opacity-30" />
                    <p className="text-[10px]">Click an element to edit</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
