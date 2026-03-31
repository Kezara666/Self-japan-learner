import { hiragana } from "./data/hiragana";
import { katakana } from "./data/katakana";
import { n5Kanji } from "./data/n5kanji";
import { n5Grammar } from "./data/n5grammar";
import type { KanaEntry } from "./data/hiragana";

export type Deck = "hiragana" | "katakana" | "kanji" | "grammar";

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function pickUnique<T>(pool: T[], exclude: Set<string>, keyFn: (t: T) => string, n: number): T[] {
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

export type KanaQuestion = {
  kind: "kana";
  deck: "hiragana" | "katakana";
  reverse: boolean;
  entry: KanaEntry;
  choices: string[];
  correctLabel: string;
};

export type KanjiQuestion = {
  kind: "kanji";
  reverse: boolean;
  entry: (typeof n5Kanji)[number];
  choices: string[];
  correctLabel: string;
};

export type GrammarQuestion = {
  kind: "grammar";
  entry: (typeof n5Grammar)[number];
  choices: string[];
  correctLabel: string;
};

export type Question = KanaQuestion | KanjiQuestion | GrammarQuestion;

export function buildKanaQuestion(
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

export function buildGrammarQuestion(): GrammarQuestion {
  const entry = n5Grammar[Math.floor(Math.random() * n5Grammar.length)]!;
  const choices = shuffle([entry.correct, ...entry.distractors]);
  return {
    kind: "grammar",
    entry,
    choices,
    correctLabel: entry.correct,
  };
}

export function buildKanjiQuestion(reverse: boolean): KanjiQuestion {
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

export function uniqueRomajiPool(list: KanaEntry[]): KanaEntry[] {
  const seen = new Set<string>();
  return list.filter((e) => {
    if (seen.has(e.romaji)) return false;
    seen.add(e.romaji);
    return true;
  });
}

export function nextQuestion(deck: Deck, kanaReverse: boolean, kanjiReverse: boolean): Question {
  if (deck === "hiragana")
    return buildKanaQuestion(uniqueRomajiPool(hiragana), "hiragana", kanaReverse);
  if (deck === "katakana")
    return buildKanaQuestion(uniqueRomajiPool(katakana), "katakana", kanaReverse);
  if (deck === "grammar") return buildGrammarQuestion();
  return buildKanjiQuestion(kanjiReverse);
}

export const deckActiveRing: Record<Deck, string> = {
  hiragana: "border-sky-400/70 ring-1 ring-sky-400/70 bg-white/[0.03]",
  katakana: "border-violet-400/70 ring-1 ring-violet-400/70 bg-white/[0.03]",
  kanji: "border-amber-400/70 ring-1 ring-amber-400/70 bg-white/[0.03]",
  grammar: "border-teal-400/70 ring-1 ring-teal-400/70 bg-white/[0.03]",
};

export const deckText: Record<Deck, string> = {
  hiragana: "text-sky-400",
  katakana: "text-violet-400",
  kanji: "text-amber-400",
  grammar: "text-teal-400",
};
