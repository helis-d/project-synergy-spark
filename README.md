# North

North is a local-first writing environment. It is a rich-text editor that keeps
your drafts on your own machine, adapts its theme to the time of day, and lets
you fork a document into branches while you explore an idea.

It runs in two places from a single codebase:

- **Web** — a TanStack Start app, installable as a PWA on mobile and desktop.
- **Desktop** — the same app packaged with Electron, with a native save dialog
  and encrypted storage for your AI key.

## Features

- **Rich text editing** — headings, bold/italic/underline/strikethrough, lists,
  blockquotes, inline code, text colour, and links.
- **Live outline** — headings are indexed as you type; click to jump.
- **Branching** — fork the current document into a named branch, edit it
  independently, and compare added/removed words against `main`.
- **Time-of-day themes** — dawn, day, dusk and night palettes switch
  automatically, or pin an hour manually with the theme slider.
- **Markdown mode** — convert the document to Markdown, edit it as plain text,
  and convert back.
- **Voice dictation** — dictate into the document using the browser speech
  recognition API (where available).
- **Flow Mode** — after a short pause, an AI suggestion for the next sentence
  appears as ghost text. `Tab` accepts, `Esc` dismisses.
- **Document library** — search, open, delete and import documents.
- **Import / export** — `.nh` (North's own format, preserves branches), `.md`,
  `.html` and `.txt`.
- **Local-first storage** — documents live in this browser / this machine. There
  is no account and no server-side document database.

## Running the web app

Requires Node.js and npm.

```sh
npm install
npm run dev          # dev server
npm run build        # production build into .output
npm run preview      # preview the production build
```

## Running the desktop app

```sh
npm run electron:dev      # Vite dev server + Electron, with hot reload
npm run electron:preview  # production build, served by the bundled server
npm run electron:build    # packaged installers into release/
```

`electron:dev` loads the app from the Vite dev server. `electron:preview` builds
first and then runs the same code path the packaged app uses: a small local HTTP
server (`electron/server-wrapper.cjs`) serves `.output/public` from disk and
forwards everything else to the Nitro handler for SSR and server functions.

## Flow Mode requires your own API key

Flow Mode is off by default and does **not** ship with an API key. To use it,
open the side panel and add a key from one of the supported providers:

| Provider   | Base URL                        |
| ---------- | ------------------------------- |
| OpenRouter | `https://openrouter.ai/api/v1`  |
| OpenAI     | `https://api.openai.com/v1`     |
| Groq       | `https://api.groq.com/openai/v1`|
| DeepSeek   | `https://api.deepseek.com/v1`   |

How the key is handled, stated plainly:

- On the **web**, it is stored in this browser's `localStorage`.
- On the **desktop**, it is stored encrypted at rest via Electron's
  `safeStorage`, not in `localStorage`.
- On **every suggestion request** the key is sent to the North server, which
  proxies the call to the provider. The key does not stay only on your device.

Only the four hosts above are accepted, over HTTPS. Arbitrary base URLs are
rejected so the proxy cannot be pointed at internal or localhost services.

## Security notes

- All HTML is passed through `src/lib/north/sanitize.ts` (DOMPurify, with a
  tag/attribute allowlist matching what the editor produces) both on import and
  on every `innerHTML` assignment, so previously imported documents are
  neutralised on read as well as on write.
- The Flow Mode server function enforces the host allowlist in its validator,
  before any outbound request is made.

## Testing

```sh
npm run test        # vitest, once
npm run test:watch
npm run lint
npx tsc --noEmit
```

## Tech stack

TanStack Start (React 19) with Vite, Tailwind CSS v4 with `oklch` design tokens
in `src/styles.css`, Zod for validation, DOMPurify for sanitization, Electron
for the desktop build, and Vitest for tests.
