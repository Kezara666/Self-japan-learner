import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { WriteScript } from "../components/BlackboardPractice";

const writeDeckRing: Record<WriteScript, string> = {
  hiragana: "border-sky-400/70 ring-1 ring-sky-400/70 bg-white/[0.03]",
  katakana: "border-violet-400/70 ring-1 ring-violet-400/70 bg-white/[0.03]",
  kanji: "border-amber-400/70 ring-1 ring-amber-400/70 bg-white/[0.03]",
};

export function WritingHome() {
  const navigate = useNavigate();
  const [writeScript, setWriteScript] = useState<WriteScript>("hiragana");

  return (
    <div className="mx-auto flex max-w-[520px] flex-col gap-6 px-4 pb-10 pt-5 sm:px-5 sm:pt-8">
      <header>
        <h1 className="mb-1.5 text-3xl font-bold tracking-tight">Writing</h1>
        <p className="m-0 text-[0.95rem] text-slate-400">
          Blackboard, grid, tracing guide, and animated stroke order (KanjiVG)
        </p>
      </header>

      <section
        className="rounded-2xl border border-[#2d3548] bg-[#1a1f2e] p-5"
        aria-labelledby="write-heading"
      >
        <h2 id="write-heading" className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Script
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          Choose what to practice, then open the board. Use the sidebar anytime to switch to Quiz.
        </p>
        <div className="mb-4 flex flex-col gap-2.5" role="group" aria-label="Script for writing">
          {(
            [
              ["hiragana", "Hiragana", "All kana in the quiz list"],
              ["katakana", "Katakana", "All kana in the quiz list"],
              ["kanji", "N5 Kanji", "Kanji from the N5 deck"],
            ] as const
          ).map(([id, title, hint]) => (
            <button
              key={id}
              type="button"
              className={`flex flex-col items-start gap-0.5 rounded-xl border border-[#2d3548] bg-[#0f1219] px-4 py-3.5 text-left text-[#e8eaef] transition-colors hover:border-slate-500 hover:bg-[#232838] ${
                writeScript === id ? writeDeckRing[id] : ""
              }`}
              onClick={() => setWriteScript(id)}
            >
              <span className="text-base font-semibold">{title}</span>
              <span className="text-sm text-slate-400">{hint}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="w-full rounded-[10px] border border-emerald-700/50 bg-emerald-950/40 px-5 py-3.5 text-base font-semibold text-emerald-100 hover:bg-emerald-950/60"
          onClick={() => navigate(`/writing/board?script=${writeScript}`)}
        >
          Open blackboard
        </button>
      </section>

      <footer className="text-center text-xs text-slate-500">Strokes load from the network (KanjiVG on GitHub)</footer>
    </div>
  );
}
