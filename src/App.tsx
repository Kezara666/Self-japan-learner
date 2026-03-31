import { useCallback, useEffect, useMemo, useState } from "react";
import { hiragana } from "./data/hiragana";
import { katakana } from "./data/katakana";
import { n5Kanji } from "./data/n5kanji";
import { n5Grammar } from "./data/n5grammar";
import type { KanaEntry } from "./data/hiragana";

type Deck = "hiragana" | "katakana" | "kanji" | "grammar";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function pickUnique<T>(pool: T[], exclude: Set<string>, keyFn: (t: T) => string, n: number): T[] {
  const out: T[] = [];
  const shuffled = shuffle(pool);
  for (const item of shuffled) {
    const k = keyFn(item);
    if (exclude.has(k)) continue;
    exclude.add(k);
    out.push(item);
    if (out.length >= n) break;
  }
  return out;
}

type KanaQuestion = {
  kind: "kana";
  deck: "hiragana" | "katakana";
  reverse: boolean;
  entry: KanaEntry;
  choices: string[];
  correctLabel: string;
};

type KanjiQuestion = {
  kind: "kanji";
  reverse: boolean;
  entry: (typeof n5Kanji)[number];
  choices: string[];
  correctLabel: string;
};

type GrammarQuestion = {
  kind: "grammar";
  entry: (typeof n5Grammar)[number];
  choices: string[];
  correctLabel: string;
};

type Question = KanaQuestion | KanjiQuestion | GrammarQuestion;

function buildKanaQuestion(
  list: KanaEntry[],
  deck: "hiragana" | "katakana",
  reverse: boolean
): KanaQuestion {
  const entry = list[Math.floor(Math.random() * list.length)]!;
  if (!reverse) {
    const others = pickUnique(
      list,
      new Set([entry.romaji]),
      (e) => e.romaji,
      3
    ).map((e) => e.romaji);
    const choices = shuffle([entry.romaji, ...others]);
    return {
      kind: "kana",
      deck,
      reverse: false,
      entry,
      choices,
      correctLabel: entry.romaji,
    };
  }
  const others = pickUnique(
    list,
    new Set([entry.char]),
    (e) => e.char,
    3
  ).map((e) => e.char);
  const choices = shuffle([entry.char, ...others]);
  return {
    kind: "kana",
    deck,
    reverse: true,
    entry,
    choices,
    correctLabel: entry.char,
  };
}

function buildGrammarQuestion(): GrammarQuestion {
  const entry = n5Grammar[Math.floor(Math.random() * n5Grammar.length)]!;
  const choices = shuffle([entry.correct, ...entry.distractors]);
  return {
    kind: "grammar",
    entry,
    choices,
    correctLabel: entry.correct,
  };
}

function buildKanjiQuestion(reverse: boolean): KanjiQuestion {
  const entry = n5Kanji[Math.floor(Math.random() * n5Kanji.length)]!;
  if (!reverse) {
    const others = pickUnique(
      n5Kanji,
      new Set([entry.meaning]),
      (k) => k.meaning,
      3
    ).map((k) => k.meaning);
    const choices = shuffle([entry.meaning, ...others]);
    return {
      kind: "kanji",
      reverse: false,
      entry,
      choices,
      correctLabel: entry.meaning,
    };
  }
  const others = pickUnique(
    n5Kanji,
    new Set([entry.kanji]),
    (k) => k.kanji,
    3
  ).map((k) => k.kanji);
  const choices = shuffle([entry.kanji, ...others]);
  return {
    kind: "kanji",
    reverse: true,
    entry,
    choices,
    correctLabel: entry.kanji,
  };
}

function uniqueRomajiPool(list: KanaEntry[]): KanaEntry[] {
  const seen = new Set<string>();
  return list.filter((e) => {
    if (seen.has(e.romaji)) return false;
    seen.add(e.romaji);
    return true;
  });
}

function nextQuestion(deck: Deck, kanaReverse: boolean, kanjiReverse: boolean): Question {
  if (deck === "hiragana")
    return buildKanaQuestion(uniqueRomajiPool(hiragana), "hiragana", kanaReverse);
  if (deck === "katakana")
    return buildKanaQuestion(uniqueRomajiPool(katakana), "katakana", kanaReverse);
  if (deck === "grammar") return buildGrammarQuestion();
  return buildKanjiQuestion(kanjiReverse);
}

const deckActiveRing: Record<Deck, string> = {
  hiragana: "border-sky-400/70 ring-1 ring-sky-400/70 bg-white/[0.03]",
  katakana: "border-violet-400/70 ring-1 ring-violet-400/70 bg-white/[0.03]",
  kanji: "border-amber-400/70 ring-1 ring-amber-400/70 bg-white/[0.03]",
  grammar: "border-teal-400/70 ring-1 ring-teal-400/70 bg-white/[0.03]",
};

const deckText: Record<Deck, string> = {
  hiragana: "text-sky-400",
  katakana: "text-violet-400",
  kanji: "text-amber-400",
  grammar: "text-teal-400",
};

export default function App() {
  const [screen, setScreen] = useState<"home" | "practice">("home");
  const [deck, setDeck] = useState<Deck>("hiragana");
  const [kanaReverse, setKanaReverse] = useState(false);
  const [kanjiReverse, setKanjiReverse] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [picked, setPicked] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);

  const startPractice = useCallback(() => {
    setScore({ correct: 0, total: 0 });
    setStreak(0);
    setPicked(null);
    setQuestion(nextQuestion(deck, kanaReverse, kanjiReverse));
    setScreen("practice");
  }, [deck, kanaReverse, kanjiReverse]);

  const advance = useCallback(() => {
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
    if (screen !== "practice" || !question) return;
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
  }, [screen, question, picked, onChoose, advance]);

  const deckLabel = useMemo(() => {
    if (deck === "hiragana") return "Hiragana";
    if (deck === "katakana") return "Katakana";
    if (deck === "grammar") return "N5 Grammar";
    return "N5 Kanji";
  }, [deck]);

  if (screen === "home") {
    return (
      <div className="mx-auto flex min-h-screen max-w-[520px] flex-col gap-6 px-4 pb-8 pt-5 sm:px-5 sm:pt-8">
        <header>
          <h1 className="mb-1.5 text-3xl font-bold tracking-tight">Japanese Practice</h1>
          <p className="m-0 text-[0.95rem] text-slate-400">
            Hiragana, katakana, JLPT N5 kanji and grammar
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
            onClick={startPractice}
          >
            Start practice
          </button>
        </section>

        <footer className="text-center text-xs text-slate-500">
          Multiple choice · Keyboard: 1–4 to answer
        </footer>
      </div>
    );
  }

  if (!question) return null;

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
    <div className="mx-auto flex min-h-screen max-w-[520px] flex-col px-4 pb-8 pt-5 sm:px-5 sm:pt-8">
      <header className="mb-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="rounded-[10px] border-none bg-transparent px-2 py-1.5 text-sm font-semibold text-slate-400 hover:text-[#e8eaef]"
          onClick={() => setScreen("home")}
        >
          ← Back
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
