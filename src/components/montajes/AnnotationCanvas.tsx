"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas, Circle, FabricImage, Group, IText, Line, PencilBrush, Rect, Triangle } from "fabric";
import {
  Circle as CircleIcon,
  MoveUpRight,
  MousePointer2,
  Pencil,
  Square,
  Trash2,
  Type,
  Eraser,
} from "lucide-react";
import { clsx } from "@/lib/clsx";

type Tool = "select" | "circle" | "rect" | "arrow" | "pen" | "text";

const COLORS = ["#ef4444", "#eab308", "#84cc16"];
const STROKE_WIDTH = 4;
const MAX_CANVAS_WIDTH = 800;
const MAX_CANVAS_HEIGHT = 500;

const TOOLS: { value: Tool; label: string; icon: typeof MousePointer2 }[] = [
  { value: "select", label: "Seleccionar", icon: MousePointer2 },
  { value: "circle", label: "Círculo", icon: CircleIcon },
  { value: "rect", label: "Rectángulo", icon: Square },
  { value: "arrow", label: "Flecha", icon: MoveUpRight },
  { value: "pen", label: "Dibujo libre", icon: Pencil },
  { value: "text", label: "Texto", icon: Type },
];

// Editor de marcado sobre una foto (recortada por PhotoAnnotationModal antes de llegar
// acá) — círculos/rectángulos/flechas/texto/dibujo libre para que el instalador sepa
// exactamente qué hacer. Se construye sobre fabric.js en vez de reimplementar
// arrastrar/redimensionar/rotar formas a mano. Sin undo real: "Eliminar seleccionado" +
// "Borrar todo" alcanza para el caso de uso (marcar un par de cosas en una foto) sin la
// complejidad de un stack de snapshots — ver docs/features/montajes.md.
export default function AnnotationCanvas({
  imageUrl,
  onReady,
}: {
  imageUrl: string;
  onReady: (exportFn: () => Promise<Blob | null>) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const baseImageRef = useRef<FabricImage | null>(null);
  // Encadena la disposición de un canvas con la creación del siguiente. `dispose()` es
  // async, y React StrictMode monta el efecto dos veces seguidas en dev — sin esto, el
  // segundo `new Canvas(...)` se construye sobre el MISMO elemento <canvas> mientras el
  // primero todavía se está liberando, y ambas instancias terminan pisándose la
  // estructura interna que fabric arma alrededor del elemento (lower-canvas/upper-canvas).
  // El síntoma no es un error visible: la imagen se renderiza encogida a un cuarto del
  // lienzo (mitad de ancho × mitad de alto), como si hubiera un factor de escala 0.5
  // fantasma — nada en la matemática de escala propia tiene la culpa.
  const lifecycleChainRef = useRef<Promise<void>>(Promise.resolve());
  const [tool, setTool] = useState<Tool>("select");
  const [color, setColor] = useState(COLORS[0]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!canvasElRef.current || !containerRef.current) return;
    let cancelled = false;
    let canvas: Canvas | null = null;

    const setupDone = lifecycleChainRef.current.then(async () => {
      if (cancelled || !canvasElRef.current || !containerRef.current) return;

      // enableRetinaScaling:false: no afecta el bug de fabric 7.x documentado en
      // package.json (ver comentario junto a la dependencia "fabric"), pero es la
      // postura correcta igual — este canvas se exporta a un tamaño fijo, no tiene
      // sentido pagar el costo de un backing store a devicePixelRatio×.
      canvas = new Canvas(canvasElRef.current, { enableRetinaScaling: false });
      fabricRef.current = canvas;

      const img = await FabricImage.fromURL(imageUrl);
      if (cancelled) return;

      const containerWidth = containerRef.current.clientWidth || MAX_CANVAS_WIDTH;
      const maxWidth = Math.min(containerWidth, MAX_CANVAS_WIDTH);
      const scale = Math.min(maxWidth / (img.width || 1), MAX_CANVAS_HEIGHT / (img.height || 1), 1);
      const width = Math.round((img.width || 0) * scale);
      const height = Math.round((img.height || 0) * scale);

      canvas.setDimensions({ width, height });
      img.set({ left: 0, top: 0, scaleX: scale, scaleY: scale, selectable: false, evented: false, hoverCursor: "default" });
      canvas.add(img);
      canvas.sendObjectToBack(img);
      canvas.requestRenderAll();

      baseImageRef.current = img;
      setReady(true);
    });

    return () => {
      cancelled = true;
      lifecycleChainRef.current = setupDone.then(() => {
        fabricRef.current = null;
        return canvas ? canvas.dispose().then(() => {}) : undefined;
      });
    };
  }, [imageUrl]);

  const handleExport = useCallback(async (): Promise<Blob | null> => {
    const canvas = fabricRef.current;
    if (!canvas) return null;
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    return canvas.toBlob({ format: "jpeg", quality: 0.85, multiplier: 1 });
  }, []);

  useEffect(() => {
    onReady(handleExport);
  }, [onReady, handleExport]);

  function addCircle() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const circle = new Circle({
      left: canvas.getWidth() / 2 - 40,
      top: canvas.getHeight() / 2 - 40,
      radius: 40,
      fill: "transparent",
      stroke: color,
      strokeWidth: STROKE_WIDTH,
    });
    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.requestRenderAll();
  }

  function addRect() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const rect = new Rect({
      left: canvas.getWidth() / 2 - 50,
      top: canvas.getHeight() / 2 - 35,
      width: 100,
      height: 70,
      fill: "transparent",
      stroke: color,
      strokeWidth: STROKE_WIDTH,
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.requestRenderAll();
  }

  function addArrow() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    // fabric no tiene una primitiva de flecha — línea + triángulo (cabeza) agrupados,
    // apuntando siempre izquierda→derecha; el usuario la rota/escala con los controles
    // normales del grupo en vez de manejar extremos arrastrables a mano.
    const line = new Line([0, 20, 100, 20], { stroke: color, strokeWidth: STROKE_WIDTH });
    const head = new Triangle({
      left: 100,
      top: 20,
      width: 16,
      height: 20,
      fill: color,
      angle: 90,
      originX: "center",
      originY: "center",
    });
    const arrow = new Group([line, head], { left: canvas.getWidth() / 2 - 50, top: canvas.getHeight() / 2 });
    canvas.add(arrow);
    canvas.setActiveObject(arrow);
    canvas.requestRenderAll();
  }

  function addText() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const text = new IText("Texto", {
      left: canvas.getWidth() / 2 - 30,
      top: canvas.getHeight() / 2,
      fill: color,
      fontSize: 28,
      fontWeight: "bold",
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    text.enterEditing();
    text.selectAll();
    canvas.requestRenderAll();
  }

  function enablePen() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const brush = new PencilBrush(canvas);
    brush.color = color;
    brush.width = STROKE_WIDTH;
    canvas.freeDrawingBrush = brush;
    canvas.isDrawingMode = true;
  }

  function handleToolClick(t: Tool) {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.isDrawingMode = false;

    if (t === "circle") return addCircle(), setTool("select");
    if (t === "rect") return addRect(), setTool("select");
    if (t === "arrow") return addArrow(), setTool("select");
    if (t === "text") return addText(), setTool("select");
    if (t === "pen") {
      enablePen();
      setTool("pen");
      return;
    }
    setTool("select");
  }

  function handleColorClick(next: string) {
    setColor(next);
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (active) {
      active.set(active instanceof IText ? { fill: next } : { stroke: next });
      canvas.requestRenderAll();
    }
    if (canvas.freeDrawingBrush) canvas.freeDrawingBrush.color = next;
  }

  function deleteSelected() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.getActiveObjects().forEach((obj) => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  }

  function clearAll() {
    const canvas = fabricRef.current;
    const base = baseImageRef.current;
    if (!canvas || !base) return;
    canvas
      .getObjects()
      .filter((obj) => obj !== base)
      .forEach((obj) => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {TOOLS.map((t) => (
          <button
            key={t.value}
            type="button"
            title={t.label}
            aria-label={t.label}
            onClick={() => handleToolClick(t.value)}
            className={clsx(
              "flex h-9 w-9 items-center justify-center rounded-md border transition",
              tool === t.value
                ? "border-c24-teal bg-c24-teal-light text-c24-navy"
                : "border-c24-border text-c24-navy hover:bg-c24-teal-light/60",
            )}
          >
            <t.icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </button>
        ))}

        <div className="mx-1 h-6 w-px bg-c24-border" />

        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            title="Color"
            aria-label="Color"
            onClick={() => handleColorClick(c)}
            className={clsx(
              "h-7 w-7 rounded-full border-2 transition",
              color === c ? "border-c24-navy" : "border-transparent",
            )}
            style={{ backgroundColor: c }}
          />
        ))}

        <div className="mx-1 h-6 w-px bg-c24-border" />

        <button
          type="button"
          title="Eliminar seleccionado"
          aria-label="Eliminar seleccionado"
          onClick={deleteSelected}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-c24-border text-c24-navy transition hover:bg-c24-teal-light/60"
        >
          <Trash2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          title="Borrar todo"
          aria-label="Borrar todo"
          onClick={clearAll}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-c24-border text-c24-navy transition hover:bg-c24-teal-light/60"
        >
          <Eraser className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </button>
      </div>

      <div ref={containerRef} className="touch-none overflow-hidden rounded-md border border-c24-border bg-c24-teal-light/30">
        <canvas ref={canvasElRef} />
        {!ready && <p className="p-4 text-sm text-c24-text-muted">Cargando imagen…</p>}
      </div>
    </div>
  );
}
