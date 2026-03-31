# Japanese Practice

A small web app for drilling **hiragana**, **katakana**, **JLPT N5–style kanji**, and **N5 grammar** with multiple-choice quizzes. Built with **React**, **Vite**, **TypeScript**, and **Tailwind CSS**.

## Features

- **Hiragana & katakana** — Gojūon, dakuten/handakuten, and yōon. Toggle **reverse mode** (romaji → pick kana).
- **N5 kanji** — Meaning and reading hints. Toggle **reverse mode** (English → pick kanji).
- **N5 grammar** — Fill-in-the-blank style prompts (particles, です／ます, て-form, ない, and more). After each answer you get the correct form plus a short note when available.
- **Keyboard** — Press `1`–`4` to choose an answer; after answering, `Enter` or `Space` for the next question.
- **Score & streak** — Shown on the practice screen.

## Requirements

- Node.js 18+ (recommended)

## Setup

```bash
npm install
```

## Scripts

| Command        | Description                          |
| -------------- | ------------------------------------ |
| `npm run dev`  | Start dev server (Vite)              |
| `npm run build`| Typecheck and production build       |
| `npm run preview` | Serve the `dist` folder locally   |

After `npm run dev`, open the URL shown in the terminal (usually `http://localhost:5173`).

## Project layout

- `src/App.tsx` — UI and quiz logic
- `src/data/hiragana.ts`, `katakana.ts`, `n5kanji.ts`, `n5grammar.ts` — Drill data
