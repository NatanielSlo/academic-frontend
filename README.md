# AcademicAI — Frontend

React frontend for the TUM lecture assistant. Add a lecture URL, let the backend process it, then study with AI-generated notes, quizzes, and a Q&A chat grounded in the transcript.

## Stack

| | |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS 3 + `@tailwindcss/typography` |
| Routing | React Router 7 |
| HTTP | Axios |
| Markdown | `react-markdown` + `remark-gfm` + `mermaid` |
| Fonts | Syne (headings) · DM Sans (body) — Google Fonts |

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

The app expects a backend at `http://localhost:8000` by default. Override with an env var:

```bash
# .env.local
VITE_API_BASE_URL=http://your-backend-host
```

## Pages

| Route | Description |
|---|---|
| `/` | Lecture list with sidebar navigation |
| `/lectures/:id` | Lecture detail — status, links to all tools |
| `/lectures/:id/transcript` | Full searchable transcript |
| `/lectures/:id/notes` | AI-generated notes with Mermaid diagrams and PL/EN translation |
| `/lectures/:id/comprehensive-quiz` | Generate and take a new quiz |
| `/lectures/:id/quizzes` | Past quiz attempts |
| `/quizzes/:id` | Take a specific quiz |
| `/quizzes/:quizId/attempts/:attemptId` | Quiz results |
| `/chat` | Q&A chat grounded in lecture transcripts |

## Build

```bash
npm run build      # output: dist/
npm run preview    # preview the production build locally
npm run lint
```

## Notes

- Lecture URLs must be from `https://live.rbg.tum.de/` — validated on the add-lecture form.
- Notes translation is lazy: clicking a language button fetches an existing translation first, and only triggers generation if none exists (polls every 3 s until ready).
- Mermaid diagrams embedded in AI notes are rendered client-side.
