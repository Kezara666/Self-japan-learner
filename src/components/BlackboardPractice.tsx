import { useCallback, useEffect, useRef, useState } from "react";
import { hiragana } from "../data/hiragana";
import { katakana } from "../data/katakana";
import { n5Kanji } from "../data/n5kanji";

export type WriteScript = "hiragana" | "katakana" | "kanji";

type Props = {
  script: WriteScript;
  onBack: () => void;
};

type CharPick = { char: string; sublabel: string; readings?: string };

function pickRandom(script: WriteScript): CharPick {
  if (script === "hiragana") {
    const e = hiragana[Math.floor(Math.random() * hiragana.length)]!;
    return { char: e.char, sublabel: e.romaji };
  }
  if (script === "katakana") {
    const e = katakana[Math.floor(Math.random() * katakana.length)]!;
    return { char: e.char, sublabel: e.romaji };
  }
  const e = n5Kanji[Math.floor(Math.random() * n5Kanji.length)]!;
  return { char: e.kanji, sublabel: e.meaning, readings: e.readings };
}

function drawPracticeFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  tengi: boolean
) {
  const pad = Math.min(w, h) * 0.07;
  const s = Math.min(w - 2 * pad, h - 2 * pad);
  const x0 = (w - s) / 2;
  const y0 = (h - s) / 2;
  ctx.strokeStyle = tengi ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.09)";
  ctx.lineWidth = Math.max(1, w / 400);
  ctx.strokeRect(x0, y0, s, s);
  ctx.beginPath();
  ctx.moveTo(x0 + s / 2, y0);
  ctx.lineTo(x0 + s / 2, y0 + s);
  ctx.moveTo(x0, y0 + s / 2);
  ctx.lineTo(x0 + s, y0 + s / 2);
  ctx.stroke();
}

function drawGuideText(ctx: CanvasRenderingContext2D, w: number, h: number, char: string, bold: boolean) {
  const size = Math.min(w, h) * (bold ? 0.62 : 0.58);
  ctx.save();
  ctx.globalAlpha = 0.13;
  ctx.fillStyle = "#f5f5f0";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${bold ? "700" : "500"} ${size}px "Zen Kaku Gothic New", "Hiragino Sans", sans-serif`;
  ctx.fillText(char, w / 2, h / 2);
  ctx.restore();
}

const scriptLabel: Record<WriteScript, string> = {
  hiragana: "Hiragana",
  katakana: "Katakana",
  kanji: "N5 Kanji",
};

const scriptAccent: Record<WriteScript, string> = {
  hiragana: "text-sky-400",
  katakana: "text-violet-400",
  kanji: "text-amber-400",
};

function clearDrawLayer(draw: HTMLCanvasElement | null) {
  if (!draw) return;
  const d = draw.getContext("2d");
  if (d) d.clearRect(0, 0, draw.width, draw.height);
}

export function BlackboardPractice({ script, onBack }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef<HTMLCanvasElement>(null);
  const [pick, setPick] = useState<CharPick>(() => pickRandom(script));
  const [showGuide, setShowGuide] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setPick(pickRandom(script));
  }, [script]);

  const layoutCanvases = useCallback((): boolean => {
    const wrap = wrapRef.current;
    const base = baseRef.current;
    const draw = drawRef.current;
    if (!wrap || !base || !draw) return false;

    const rect = wrap.getBoundingClientRect();
    const cssW = rect.width;
    const cssH = rect.height;
    if (cssW < 2 || cssH < 2) return false;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const bw = Math.floor(cssW * dpr);
    const bh = Math.floor(cssH * dpr);
    const sizeChanged = base.width !== bw || base.height !== bh;

    for (const canvas of [base, draw]) {
      canvas.width = bw;
      canvas.height = bh;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
    }

    return sizeChanged;
  }, []);

  const paintBase = useCallback(() => {
    const base = baseRef.current;
    if (!base) return;
    const ctx = base.getContext("2d");
    if (!ctx) return;
    const w = base.width;
    const h = base.height;
    ctx.fillStyle = "#1a2820";
    ctx.fillRect(0, 0, w, h);
    if (showGrid) drawPracticeFrame(ctx, w, h, script === "kanji");
    if (showGuide) drawGuideText(ctx, w, h, pick.char, script === "kanji");
  }, [pick.char, showGrid, showGuide, script]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const run = () => {
      const sizeChanged = layoutCanvases();
      if (sizeChanged) clearDrawLayer(drawRef.current);
      paintBase();
    };

    const ro = new ResizeObserver(run);
    ro.observe(wrap);
    run();
    return () => ro.disconnect();
  }, [layoutCanvases, paintBase]);

  useEffect(() => {
    clearDrawLayer(drawRef.current);
  }, [pick.char]);

  const clearDrawing = useCallback(() => {
    clearDrawLayer(drawRef.current);
  }, []);

  const nextChar = useCallback(() => {
    setPick(pickRandom(script));
  }, [script]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = drawRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const brush = script === "kanji" ? 3.2 : 2.8;

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = getPos(e);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const canvas = drawRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const p = getPos(e);
    const prev = last.current ?? p;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.strokeStyle = "rgba(240, 245, 235, 0.92)";
    ctx.lineWidth = brush * dpr;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };

  const endStroke = () => {
    drawing.current = false;
    last.current = null;
  };

  const jishoUrl = `https://jisho.org/search/${encodeURIComponent(pick.char)}%20%23kanji`;

  return (
    <div className="mx-auto flex min-h-screen max-w-[520px] flex-col px-4 pb-8 pt-5 sm:px-5 sm:pt-8">
      <header className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded-[10px] border-none bg-transparent px-2 py-1.5 text-sm font-semibold text-slate-400 hover:text-[#e8eaef]"
          onClick={onBack}
        >
          ← Home
        </button>
        <span className={`font-bold ${scriptAccent[script]}`}>Blackboard · {scriptLabel[script]}</span>
      </header>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-zen text-4xl font-semibold leading-none text-[#e8eaef] sm:text-5xl" lang="ja">
            {pick.char}
          </p>
          <p className="mt-1 truncate text-sm text-slate-400">
            {script === "kanji" ? (
              <>
                {pick.sublabel}
                {pick.readings ? <span className="text-slate-500"> · {pick.readings}</span> : null}
              </>
            ) : (
              <>Romaji: {pick.sublabel}</>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-[#2d3548] bg-[#1a1f2e] px-3 py-2 text-xs font-semibold text-[#e8eaef] hover:bg-[#232838]"
            onClick={nextChar}
          >
            Next char
          </button>
          <button
            type="button"
            className="rounded-lg border border-[#2d3548] bg-[#1a1f2e] px-3 py-2 text-xs font-semibold text-[#e8eaef] hover:bg-[#232838]"
            onClick={clearDrawing}
          >
            Erase
          </button>
        </div>
      </div>

      <p className="mb-2 text-xs text-slate-500">
        Draw in the square. Use <strong className="text-slate-400">tracing guide</strong> for stroke shape,
        then hide it to test recall. Kanji uses a bolder <strong className="text-slate-400">田字</strong> grid;
        kana uses a lighter one.
      </p>

      <div className="mb-3 flex flex-wrap gap-4 text-sm">
        <label className="flex cursor-pointer select-none items-center gap-2 text-slate-400">
          <input
            type="checkbox"
            className="size-4 accent-emerald-500"
            checked={showGuide}
            onChange={(e) => setShowGuide(e.target.checked)}
          />
          Tracing guide
        </label>
        <label className="flex cursor-pointer select-none items-center gap-2 text-slate-400">
          <input
            type="checkbox"
            className="size-4 accent-emerald-500"
            checked={showGrid}
            onChange={(e) => setShowGrid(e.target.checked)}
          />
          Grid
        </label>
      </div>

      <div
        ref={wrapRef}
        className="relative aspect-square w-full max-w-md self-center overflow-hidden rounded-xl border-2 border-[#2a3d30] shadow-[inset_0_2px_20px_rgba(0,0,0,0.25)]"
      >
        <canvas ref={baseRef} className="pointer-events-none absolute inset-0 block size-full" aria-hidden />
        <canvas
          ref={drawRef}
          className="absolute inset-0 block size-full touch-none"
          style={{ touchAction: "none" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          onPointerLeave={(e) => {
            if (e.buttons === 0) endStroke();
          }}
        />
      </div>

      <div className="mt-4 space-y-1 text-center text-xs text-slate-500">
        <p>
          Finger, stylus, or mouse. This does not auto-score your handwriting — use the model and optional{" "}
          <span className="text-slate-400">Jisho</span> animation for stroke order.
        </p>
        <a
          href={jishoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-emerald-500/90 underline-offset-2 hover:underline"
        >
          Stroke order on Jisho →
        </a>
      </div>
    </div>
  );
}
