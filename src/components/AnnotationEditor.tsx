"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Download, Minus, Redo, Square, Type, Undo, X } from "lucide-react";

type Tool = "line" | "rectangle" | "text";
type Shape = {
  type: Tool;
  start: { x: number; y: number };
  end?: { x: number; y: number };
  color: string;
  width: number;
  text?: string;
};

export function AnnotationEditor({
  image,
  onSave,
  onClose,
}: {
  image: string;
  onSave: (blob: Blob) => void;
  onClose: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<Tool>("line");
  const [color, setColor] = useState("#EF4444");
  const [width, setWidth] = useState(3);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [history, setHistory] = useState<Shape[][]>([]);
  const [index, setIndex] = useState(-1);
  const [drawing, setDrawing] = useState<Shape | null>(null);
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);

  function commit(next: Shape[]) {
    const sliced = history.slice(0, index + 1);
    sliced.push(next);
    setHistory(sliced);
    setIndex(sliced.length - 1);
    setShapes(next);
  }

  function getPos(e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }

  function drawShape(ctx: CanvasRenderingContext2D, s: Shape) {
    ctx.strokeStyle = s.color;
    ctx.fillStyle = s.color;
    ctx.lineWidth = s.width;
    if (s.type === "line" && s.end) {
      ctx.beginPath();
      ctx.moveTo(s.start.x, s.start.y);
      ctx.lineTo(s.end.x, s.end.y);
      ctx.stroke();
    } else if (s.type === "rectangle" && s.end) {
      ctx.strokeRect(s.start.x, s.start.y, s.end.x - s.start.x, s.end.y - s.start.y);
    } else if (s.type === "text" && s.text) {
      ctx.font = "bold 20px Arial";
      ctx.fillText(s.text, s.start.x, s.start.y);
    }
  }

  function redraw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      shapes.forEach((s) => drawShape(ctx, s));
      if (drawing) drawShape(ctx, drawing);
    };
    img.src = image;
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
    };
    img.src = image;
  }, [image]);

  useEffect(() => {
    redraw();
    // redraw depends on local drawing state and is intentionally invoked on these changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapes, drawing, image]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      <div className="flex h-full max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 px-6 py-4">
          <h2 className="text-xl font-bold text-white">Annotation Editor</h2>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-700"><X className="h-5 w-5 text-gray-400" /></button>
        </div>
        <div className="flex items-center gap-2 border-b border-gray-700 bg-gray-800 px-6 py-3">
          <button onClick={() => setTool("line")} className={`rounded-lg p-2 ${tool === "line" ? "bg-emerald-500 text-white" : "bg-gray-700 text-gray-300"}`}><Minus className="h-5 w-5" /></button>
          <button onClick={() => setTool("rectangle")} className={`rounded-lg p-2 ${tool === "rectangle" ? "bg-emerald-500 text-white" : "bg-gray-700 text-gray-300"}`}><Square className="h-5 w-5" /></button>
          <button onClick={() => setTool("text")} className={`rounded-lg p-2 ${tool === "text" ? "bg-emerald-500 text-white" : "bg-gray-700 text-gray-300"}`}><Type className="h-5 w-5" /></button>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-8 rounded border-0 bg-transparent" />
          <input type="range" min={1} max={10} value={width} onChange={(e) => setWidth(Number(e.target.value))} className="w-28 accent-emerald-500" />
          <div className="flex-1" />
          <button onClick={() => { if (index > 0) { setIndex(index - 1); setShapes(history[index - 1] || []); } }} className="rounded-lg bg-gray-700 p-2 text-white"><Undo className="h-5 w-5" /></button>
          <button onClick={() => { if (index < history.length - 1) { setIndex(index + 1); setShapes(history[index + 1] || []); } }} className="rounded-lg bg-gray-700 p-2 text-white"><Redo className="h-5 w-5" /></button>
          <button onClick={() => { const c = canvasRef.current; if (!c) return; const a = document.createElement("a"); a.download = "annotated-chart.png"; a.href = c.toDataURL("image/png"); a.click(); }} className="rounded-lg bg-blue-600 p-2 text-white"><Download className="h-5 w-5" /></button>
          <button onClick={() => { canvasRef.current?.toBlob((blob) => { if (blob) onSave(blob); }, "image/png"); }} className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-white"><Check className="h-5 w-5" />Save</button>
        </div>

        <div className="flex flex-1 items-center justify-center overflow-auto bg-gray-900 p-6">
          <canvas
            ref={canvasRef}
            className="max-h-full max-w-full rounded-lg border-2 border-gray-700"
            onMouseDown={(e) => {
              const p = getPos(e);
              if (tool === "text") {
                const text = prompt("Enter text:");
                if (!text) return;
                commit([...shapes, { type: "text", start: p, color, width, text }]);
                return;
              }
              setStart(p);
            }}
            onMouseMove={(e) => {
              if (!start) return;
              setDrawing({ type: tool, start, end: getPos(e), color, width });
            }}
            onMouseUp={() => {
              if (!drawing) return;
              commit([...shapes, drawing]);
              setDrawing(null);
              setStart(null);
            }}
            onMouseLeave={() => {
              if (drawing) {
                commit([...shapes, drawing]);
                setDrawing(null);
              }
              setStart(null);
            }}
          />
        </div>
      </div>
    </div>
  );
}
