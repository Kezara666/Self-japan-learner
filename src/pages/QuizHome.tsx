import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  type Deck,
  deckActiveRing,
} from "../quizLogic";

export function QuizHome() {
  const navigate = useNavigate();
  const [deck, setDeck] = useState<Deck>("hiragana");
  const [kanaReverse, setKanaReverse] = useState(false);
  const [kanjiReverse, setKanjiReverse] = useState(false);

  return (
    <div className="mx-auto flex max-w-[520px] flex-col gap-6 px-4 pb-10 pt-5 sm:px-5 sm:pt-8">
      <header>
        <h1 className="mb-1.5 text-3xl font-bold tracking-tight">Quiz</h1>
        <p className="m-0 text-[0.95rem] text-slate-400">
          Hiragana, katakana, JLPT N5 kanji and grammar — multiple choice
        </p>
      </header>

      <section
        className="rounded-2xl border border-[#2d3548] bg-[#1a1f2e] p-5"
        aria-labelledby="setup-heading"
      >
        <h2 id="setup-heading" className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Choose a deck
        </h2>
        <div className="mb-4 flex flex-col gap-2.5" role="group" aria-label="Practice deck">
          {(
            [
              ["hiragana", "Hiragana", "あ — romaji & back"],
              ["katakana", "Katakana", "ア — romaji & back"],
              ["kanji", "N5 Kanji", "Meaning ↔ character"],
              ["grammar", "N5 Grammar", "Fill-in & particles — mixed"],
            ] as const
          ).map(([id, title, hint]) => (
            <button
              key={id}
              type="button"
              className={`flex flex-col items-start gap-0.5 rounded-xl border border-[#2d3548] bg-[#0f1219] px-4 py-3.5 text-left text-[#e8eaef] transition-colors hover:border-slate-500 hover:bg-[#232838] ${
                deck === id ? deckActiveRing[id] : ""
              }`}
              onClick={() => setDeck(id)}
            >
              <span className="text-base font-semibold">{title}</span>
              <span className="text-sm text-slate-400">{hint}</span>
            </button>
          ))}
        </div>

        {deck === "hiragana" || deck === "katakana" ? (
          <label className="mb-5 flex cursor-pointer select-none items-center gap-2.5 text-sm text-slate-400">
            <input
              type="checkbox"
              className="size-4 accent-[#c45c5c]"
              checked={kanaReverse}
              onChange={(e) => setKanaReverse(e.target.checked)}
            />
            <span>Reverse: show romaji, pick kana</span>
          </label>
        ) : deck === "kanji" ? (
          <label className="mb-5 flex cursor-pointer select-none items-center gap-2.5 text-sm text-slate-400">
            <input
              type="checkbox"
              className="size-4 accent-[#c45c5c]"
              checked={kanjiReverse}
              onChange={(e) => setKanjiReverse(e.target.checked)}
            />
            <span>Reverse: show English, pick kanji</span>
          </label>
        ) : (
          <p className="mb-5 text-sm text-slate-400">
            Particles, です／ます, て-form, and other beginner patterns — pick the best fit for （　）.
          </p>
        )}

        <button
          type="button"
          className="w-full rounded-[10px] border-none bg-[#c45c5c] px-5 py-3.5 text-base font-semibold text-white hover:brightness-110"
          onClick={() =>
            navigate("/quiz/play", {
              state: { deck, kanaReverse, kanjiReverse },
            })
          }
        >
          Start practice
        </button>
      </section>

      <footer className="text-center text-xs text-slate-500">
        Keys 1–4 to answer · Enter for next question
      </footer>
    </div>
  );
}
