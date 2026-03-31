import { useCallback, useEffect, useRef, useState } from "react";

/** KanjiVG (CC BY-SA 3.0). https://kanjivg.tagaini.net */
const KANJIVG_BASE = "https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji";

const STROKE_MS = 520;
const GAP_MS = 180;
const LOOP_PAUSE_MS = 900;

function codePointHex(char: string): string | null {
  const g = [...char];
  if (g.length !== 1) return null;
  const cp = g[0]!.codePointAt(0);
  if (cp === undefined) return null;
  return cp.toString(16).padStart(5, "0").toLowerCase();
}

function collectStrokePaths(svg: SVGSVGElement): SVGPathElement[] {
  const paths = Array.from(svg.querySelectorAll("path[id*='-s']")) as SVGPathElement[];
  const tagged = paths
    .map((p) => {
      const m = /-s(\d+)$/.exec(p.id);
      return m ? { n: parseInt(m[1]!, 10), p } : null;
    })
    .filter((x): x is { n: number; p: SVGPathElement } => x !== null);
  tagged.sort((a, b) => a.n - b.n);
  return tagged.map((x) => x.p);
}

function preparePathHidden(path: SVGPathElement): number {
  path.style.fill = "none";
  path.style.stroke = "#86efac";
  path.style.strokeLinecap = "round";
  path.style.strokeLinejoin = "round";
  const w = parseFloat(path.getAttribute("stroke-width") || "") || 3;
  path.style.strokeWidth = `${Math.max(w, 3)}`;
  const len = path.getTotalLength();
  path.style.strokeDasharray = `${len}`;
  path.style.strokeDashoffset = `${len}`;
  path.style.transition = "none";
  return len;
}

function animatePathDraw(path: SVGPathElement, ms: number): Promise<void> {
  return new Promise((resolve) => {
    path.getBoundingClientRect();
    path.style.transition = `stroke-dashoffset ${ms}ms cubic-bezier(0.33, 1, 0.68, 1)`;
    path.style.strokeDashoffset = "0";
    window.setTimeout(resolve, ms + 40);
  });
}

type Props = {
  char: string;
};

export function StrokeOrderAnimation({ char }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathsRef = useRef<SVGPathElement[]>([]);
  const runIdRef = useRef(0);
  const pausedRef = useRef(false);
  const loopRef = useRef(true);

  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [strokeTotal, setStrokeTotal] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [loop, setLoop] = useState(true);

  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const bumpRun = useCallback(() => {
    runIdRef.current += 1;
  }, []);

  const resetPaths = useCallback(() => {
    for (const path of pathsRef.current) {
      const len = path.getTotalLength();
      if (len < 0.5) continue;
      path.style.transition = "none";
      path.style.strokeDasharray = `${len}`;
      path.style.strokeDashoffset = `${len}`;
    }
  }, []);

  const runSequence = useCallback(
    async (runId: number) => {
      const paths = pathsRef.current.filter((p) => p.getTotalLength() >= 0.5);
      if (paths.length === 0) return;

      const playOnce = async () => {
        for (const path of paths) {
          if (runIdRef.current !== runId) return;
          while (pausedRef.current && runIdRef.current === runId) {
            await new Promise((r) => setTimeout(r, 80));
          }
          if (runIdRef.current !== runId) return;
          await animatePathDraw(path, STROKE_MS);
          if (runIdRef.current !== runId) return;
          await new Promise((r) => setTimeout(r, GAP_MS));
        }
      };

      try {
        do {
          if (runIdRef.current !== runId) return;
          resetPaths();
          await new Promise((r) => setTimeout(r, 100));
          if (runIdRef.current !== runId) return;
          await playOnce();
          if (runIdRef.current !== runId) return;
          if (!loopRef.current) break;
          await new Promise((r) => setTimeout(r, LOOP_PAUSE_MS));
        } while (loopRef.current && runIdRef.current === runId);
      } finally {
        if (runIdRef.current === runId) {
          setPlaying(false);
          setPaused(false);
        }
      }
    },
    [resetPaths]
  );

  const runSequenceRef = useRef(runSequence);
  runSequenceRef.current = runSequence;

  const startPlayback = useCallback(() => {
    if (pathsRef.current.length === 0) return;
    bumpRun();
    setPaused(false);
    const runId = ++runIdRef.current;
    setPlaying(true);
    void runSequenceRef.current(runId);
  }, [bumpRun]);

  const togglePause = useCallback(() => {
    if (!playing) return;
    setPaused((p) => !p);
  }, [playing]);

  useEffect(() => {
    const hex = codePointHex(char);
    const mount = wrapRef.current;
    if (!hex || !mount) {
      setStatus("error");
      setErrMsg(
        !hex
          ? "Stroke animation needs one character at a time (try “Next char” for きゃ-style combos)."
          : "Missing panel"
      );
      pathsRef.current = [];
      setStrokeTotal(0);
      bumpRun();
      setPlaying(false);
      return;
    }

    bumpRun();
    setPlaying(false);
    setPaused(false);
    setStatus("loading");
    setErrMsg(null);
    pathsRef.current = [];
    mount.innerHTML = "";
    const url = `${KANJIVG_BASE}/${hex}.svg`;
    const ac = new AbortController();

    (async () => {
      try {
        const res = await fetch(url, { signal: ac.signal });
        if (!res.ok) throw new Error(`No stroke data for this character (${res.status})`);
        const text = await res.text();
        const doc = new DOMParser().parseFromString(text, "image/svg+xml");
        if (doc.querySelector("parsererror")) throw new Error("Invalid SVG");

        const root = doc.documentElement;
        if (!(root instanceof SVGSVGElement)) throw new Error("Not an SVG");

        root.removeAttribute("width");
        root.removeAttribute("height");
        root.setAttribute("width", "100%");
        root.setAttribute("height", "100%");
        root.setAttribute("preserveAspectRatio", "xMidYMid meet");
        root.style.display = "block";
        root.style.maxHeight = "240px";
        root.style.width = "100%";

        mount.appendChild(document.importNode(root, true));
        const inserted = mount.querySelector("svg");
        if (!(inserted instanceof SVGSVGElement)) throw new Error("Mount failed");

        const paths = collectStrokePaths(inserted).filter((p) => p.getTotalLength() >= 0.5);
        if (paths.length === 0) throw new Error("No drawable strokes in this SVG");

        for (const p of paths) preparePathHidden(p);
        pathsRef.current = paths;
        if (ac.signal.aborted) return;
        setStrokeTotal(paths.length);
        setStatus("ready");
        requestAnimationFrame(() => {
          if (ac.signal.aborted) return;
          setPlaying(true);
          const runId = ++runIdRef.current;
          void runSequenceRef.current(runId);
        });
      } catch (e) {
        if (ac.signal.aborted) return;
        setStatus("error");
        setErrMsg(e instanceof Error ? e.message : "Could not load strokes");
        pathsRef.current = [];
        setStrokeTotal(0);
        mount.innerHTML = "";
      }
    })();

    return () => {
      ac.abort();
      bumpRun();
      setPlaying(false);
    };
  }, [char, bumpRun]);

  return (
    <div className="rounded-xl border border-[#2d3548] bg-[#0f1512] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Stroke order (animated)</h3>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex cursor-pointer select-none items-center gap-1.5 text-xs text-slate-500">
            <input
              type="checkbox"
              className="size-3.5 accent-emerald-500"
              checked={loop}
              onChange={(e) => setLoop(e.target.checked)}
            />
            Loop
          </label>
          {status === "ready" ? (
            <>
              <button
                type="button"
                className="rounded-lg bg-emerald-700/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600"
                onClick={startPlayback}
              >
                {playing ? "Restart" : "Play again"}
              </button>
              <button
                type="button"
                className="rounded-lg border border-[#2d3548] bg-[#1a1f2e] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-[#232838] disabled:opacity-40"
                onClick={togglePause}
                disabled={!playing}
              >
                {paused ? "Resume" : "Pause"}
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div
        ref={wrapRef}
        className="flex min-h-[200px] items-center justify-center rounded-lg border border-[#1f2a22] bg-[#121c16]"
        aria-live="polite"
      />

      <div className="mt-2 text-center text-[11px] leading-relaxed text-slate-500">
        {status === "loading" && <span>Loading KanjiVG…</span>}
        {status === "error" && <span className="text-amber-200/80">{errMsg ?? "Unavailable for this character."}</span>}
        {status === "ready" && strokeTotal > 0 && (
          <span>
            {strokeTotal} stroke{strokeTotal === 1 ? "" : "s"} · Data:{" "}
            <a
              href="https://kanjivg.tagaini.net"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-500/90 underline-offset-2 hover:underline"
            >
              KanjiVG
            </a>{" "}
            (CC BY-SA 3.0)
          </span>
        )}
      </div>
    </div>
  );
}
