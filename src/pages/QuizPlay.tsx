import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  type Deck,
  type Question,
  deckText,
  nextQuestion,
} from "../quizLogic";

export type QuizPlayState = {
  deck: Deck;
  kanaReverse: boolean;
  kanjiReverse: boolean;
};

function isDeck(x: unknown): x is Deck {
  return x === "hiragana" || x === "katakana" || x === "kanji" || x === "grammar";
}

export function QuizPlay() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as QuizPlayState | null;

  const deck = state && isDeck(state.deck) ? state.deck : null;
  const kanaReverse = state?.kanaReverse ?? false;
  const kanjiReverse = state?.kanjiReverse ?? false;

  const [question, setQuestion] = useState<Question | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [picked, setPicked] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!deck) {
      navigate("/quiz", { replace: true });
      return;
    }
    setPicked(null);
    setScore({ correct: 0, total: 0 });
    setStreak(0);
    setQuestion(nextQuestion(deck, kanaReverse, kanjiReverse));
  }, [deck, kanaReverse, kanjiReverse, navigate]);

  const advance = useCallback(() => {
    if (!deck) return;
    setPicked(null);
    setQuestion(nextQuestion(deck, kanaReverse, kanjiReverse));
  }, [deck, kanaReverse, kanjiReverse]);

  const onChoose = useCallback(
    (label: string) => {
      if (picked !== null || !question) return;
      setPicked(label);
      const ok = label === question.correctLabel;
      setScore((s) => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }));
      setStreak((st) => (ok ? st + 1 : 0));
    },
    [picked, question]
  );

  useEffect(() => {
    if (!question) return;
    const onKey = (e: KeyboardEvent) => {
      if (picked === null) {
        const n = e.key === "1" ? 1 : e.key === "2" ? 2 : e.key === "3" ? 3 : e.key === "4" ? 4 : 0;
        if (n > 0 && n <= question.choices.length) {
          const label = question.choices[n - 1];
          if (label) onChoose(label);
        }
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [question, picked, onChoose, advance]);

  const deckLabel = useMemo(() => {
    if (!deck) return "";
    if (deck === "hiragana") return "Hiragana";
    if (deck === "katakana") return "Katakana";
    if (deck === "grammar") return "N5 Grammar";
    return "N5 Kanji";
  }, [deck]);

  if (!deck || !question) return null;

  const isGrammar = question.kind === "grammar";

  const prompt =
    question.kind === "grammar"
      ? null
      : question.kind === "kana"
        ? question.reverse
          ? question.entry.romaji
          : question.entry.char
        : question.reverse
          ? question.entry.meaning
          : question.entry.kanji;

  const promptLatin =
    !isGrammar &&
    ((question.kind === "kana" && question.reverse) || (question.kind === "kanji" && question.reverse));

  const promptColor =
    question.kind === "grammar"
      ? ""
      : question.kind === "kana"
        ? question.deck === "hiragana"
          ? "text-sky-400"
          : "text-violet-400"
        : "text-amber-400 font-bold";

  const promptClasses = [
    "font-zen text-center leading-none",
    promptLatin
      ? "font-sans text-[clamp(2rem,10vw,3.25rem)] font-semibold tracking-wide"
      : "font-medium text-[clamp(3.5rem,14vw,5.5rem)]",
    promptColor,
    "mx-0 rounded-2xl border border-[#2d3548] bg-[#1a1f2e] px-2 py-5",
  ].join(" ");

  const choiceLabels = question.choices.map((c, i) => ({
    key: `${i}-${c}`,
    label: c,
    num: i + 1,
  }));

  return (
    <div className="mx-auto flex max-w-[520px] flex-col px-4 pb-10 pt-5 sm:px-5 sm:pt-8">
      <header className="mb-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="rounded-[10px] border-none bg-transparent px-2 py-1.5 text-sm font-semibold text-slate-400 hover:text-[#e8eaef]"
          onClick={() => navigate("/quiz")}
        >
          ← Quiz setup
        </button>
        <span className={`min-w-0 flex-1 font-bold ${deckText[deck]}`}>{deckLabel}</span>
        <div className="text-sm tabular-nums text-slate-400">
          <span title="Correct / answered">
            {score.correct}/{score.total}
          </span>
          {streak > 0 ? (
            <span className="text-emerald-400" title="Streak">
              {" "}
              · {streak} streak
            </span>
          ) : null}
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        {question.kind === "grammar" ? (
          <div className="mx-0 rounded-2xl border border-[#2d3548] bg-[#1a1f2e] px-4 py-4 text-left sm:px-5 sm:py-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-teal-400/90">
              {question.entry.topic}
            </p>
            <p className="font-zen text-lg font-medium leading-relaxed text-[#e8eaef] sm:text-xl" lang="ja">
              {question.entry.prompt}
            </p>
            {question.entry.hint ? (
              <p className="mt-2 text-sm text-slate-400">{question.entry.hint}</p>
            ) : null}
          </div>
        ) : (
          <div className={promptClasses} lang={promptLatin ? undefined : "ja"}>
            {prompt}
          </div>
        )}

        {question.kind === "grammar" && (
          <p className="mx-0 my-3 mb-4 text-center text-sm text-slate-400">Choose the word or form for （　）</p>
        )}

        {question.kind === "kanji" && !question.reverse && (
          <p className="mx-0 my-3 mb-4 text-center text-sm text-slate-400">Pick the meaning (English)</p>
        )}
        {question.kind === "kanji" && question.reverse && (
          <p className="mx-0 my-3 mb-4 text-center text-sm text-slate-400">Pick the matching kanji</p>
        )}
        {question.kind === "kana" && (
          <p className="mx-0 my-3 mb-4 text-center text-sm text-slate-400">
            {question.reverse ? "Pick the kana" : "Pick the romaji (Hepburn-style)"}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {choiceLabels.map(({ key, label, num }) => {
            const isPicked = picked === label;
            const isCorrect = label === question.correctLabel;
            const showCorrect = picked !== null && isCorrect;
            const showWrong = picked !== null && isPicked && !isCorrect;

            const latinChoice =
              question.kind === "grammar"
                ? false
                : (question.kind === "kana" && !question.reverse) ||
                  (question.kind === "kanji" && !question.reverse);

            return (
              <button
                key={key}
                type="button"
                disabled={picked !== null}
                className={[
                  "flex cursor-pointer items-center gap-[0.65rem] rounded-[10px] border border-[#2d3548] bg-[#0f1219] px-4 py-3.5 text-left text-base text-[#e8eaef] transition-colors",
                  "hover:border-slate-500 hover:bg-[#232838] disabled:cursor-default",
                  showCorrect && "border-emerald-500/80 bg-emerald-500/15",
                  showWrong && "border-red-400/80 bg-red-400/10",
                ].join(" ")}
                onClick={() => onChoose(label)}
              >
                <span
                  className={[
                    "flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                    showCorrect && "bg-emerald-500/25 text-emerald-400",
                    showWrong && "bg-red-400/20 text-red-300",
                    !showCorrect && !showWrong && "bg-[#1a1f2e] text-slate-400",
                  ].join(" ")}
                >
                  {num}
                </span>
                <span
                  className={
                    latinChoice
                      ? "break-words font-sans"
                      : "min-w-0 break-words font-zen text-[0.95rem] sm:text-base"
                  }
                  lang={latinChoice ? "en" : "ja"}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        {picked !== null && question.kind === "kanji" && !question.reverse && (
          <p className="mt-4 rounded-[10px] border border-[#2d3548] bg-white/[0.04] p-3.5 text-sm leading-snug text-slate-400">
            Readings: <span lang="ja">{question.entry.readings}</span>
          </p>
        )}
        {picked !== null && question.kind === "kanji" && question.reverse && (
          <p className="mt-4 rounded-[10px] border border-[#2d3548] bg-white/[0.04] p-3.5 text-sm leading-snug text-slate-400">
            Meaning: {question.entry.meaning} · <span lang="ja">{question.entry.readings}</span>
          </p>
        )}
        {picked !== null && question.kind === "kana" && (
          <p className="mt-4 rounded-[10px] border border-[#2d3548] bg-white/[0.04] p-3.5 text-sm leading-snug text-slate-400">
            {question.entry.char} = <strong className="text-[#e8eaef]">{question.entry.romaji}</strong>
          </p>
        )}
        {picked !== null && question.kind === "grammar" && (
          <p className="mt-4 rounded-[10px] border border-[#2d3548] bg-white/[0.04] p-3.5 text-sm leading-snug text-slate-400">
            <span className="text-teal-400/90">{question.entry.topic}</span>
            {" · "}
            <span lang="ja">正解：</span>
            <strong className="text-[#e8eaef]" lang="ja">
              {question.correctLabel}
            </strong>
            {question.entry.note ? <> — {question.entry.note}</> : null}
          </p>
        )}

        {picked !== null && (
          <button
            type="button"
            className="mt-2 w-full rounded-[10px] border-none bg-[#c45c5c] px-4 py-3 text-sm font-semibold text-white hover:brightness-110"
            onClick={advance}
          >
            Next
          </button>
        )}
      </main>
    </div>
  );
}
