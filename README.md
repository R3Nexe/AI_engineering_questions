# AIPrep — AI Engineering & System Design Interview Platform

> A keyboard-first, terminal/IDE-inspired interview preparation platform for AI Engineering and Large-Scale System Design.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat&logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-Integrated-3ecf8e?style=flat&logo=supabase)
![Shadcn UI](https://img.shields.io/badge/Shadcn_UI-Components-black?style=flat)
![Excalidraw](https://img.shields.io/badge/Excalidraw-Whiteboard-6965db?style=flat)

---

## ⚡ Highlights & Key Features

### 1. 🎙️ Interactive Interview Workspace (`/q/[id]`)
- **Speech-to-Text (STT)**: Speak your answers naturally in real-time with browser-native speech recognition (`⌘D`).
- **Embedded Whiteboard**: Built-in Excalidraw canvas to sketch high-level architectures, with full-screen mode (`F`) and PNG export.
- **Timer & Flow Control**: User-controlled session timer with visual threshold alerts, restart confirmations, and keyboard shortcuts (`Space` to pause/resume).
- **Editor Tabs**: VS Code-style editor tabs (`prompt.md`, `answer.md`, `scratch.md`, `notes.md`, and `review.md`).
- **Self-Evaluation**: After submission, verify against expected reference answers, mark off key points, explore follow-up questions, and record SM-2 self-grades.

### 2. 🌳 NeetCode-Style Visual Roadmap Graph (`/concepts`)
- **Interactive 10-Tier DAG**: 24 core concepts organized in learning dependency order—from System Foundations (Latency, Load Balancing, Caching) through Distributed Data & Concurrency to Frontier AI Systems (RAG Pipelines, LLM Serving, Agentic Workflows).
- **Visual Mastery Bars**: Every node displays live progress bars reflecting solved questions.
- **Interactive Highlighting**: Hovering over any concept illuminates prerequisite and downstream connections in signal orange with detailed popovers.
- **Dual View Modes**: Switch seamlessly between the visual **Roadmap** graph and the hierarchical **Outline** tree.

### 3. 📖 28 System Design Study Chapters (`/chapters`)
- Complete study guides covering Volume 1 & Volume 2 topics (Rate Limiters, Distributed Key-Value Stores, Distributed Message Queues, S3-like Object Storage, Digital Wallets, Stock Exchanges, etc.).
- **380+ Inline Architecture Diagrams**: Byte-identical diagrams placed precisely in context with zoomable dialog viewers.
- **Interactive TOC & Rail**: Scroll-spy table of contents, chapter jump links, and direct connections to relevant concepts and glossary terms.

### 4. 📚 Comprehensive System Design & AI Glossary (`/glossary`)
- **146 Structured Terms across 8 Categories**: Latency & Performance, Storage & Databases, Distributed Systems, Concurrency, Networking, Messaging, Resilience, and AI/ML Systems.
- **Responsive Multi-Column Grid**: 2-column and 3-column responsive layout eliminates dead space, with a toggleable dense table **List View**.
- **Cross-Referenced**: Direct links to study chapters (`Read: Ch 04 Rate Limiter`) and related system terms with smooth flash-and-scroll navigation.

### 5. 📺 System Design Video Hub (`/videos`)
- Curated video lectures from top distributed systems educators (ByteByteGo, Gaurav Sen, Hussein Nasser, Jordan has no life, Hello Interview).
- **Synchronized 60/40 Split**: Watch tutorials with a side-by-side notes scratchpad (with `+ Insert timestamp` button) and dedicated Excalidraw whiteboard.

### 6. 🎨 Linear-Inspired Design System
- Restrained dark canvas (`#0b0d0f`, `#111318`) with warm signal-orange accent (`#e8813c`).
- **Linear Typography Stack**: Configured with Inter Variable (`cv01`, `cv02`, `cv03`, `cv04`, `cv11`, `ss01`, `ss03`, `case`) and JetBrains Mono with proportional negative tracking.
- **Accessible & Tested**: 0 anti-patterns detected via Impeccable design audits.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **UI Library**: [React 19](https://react.dev/)
- **Components**: [shadcn/ui](https://ui.shadcn.com/) (Base UI primitives)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) with client-side persistence
- **Backend / Database**: [Supabase](https://supabase.com/) (`@supabase/supabase-js`, Supabase CLI linked)
- **Whiteboard Engine**: [@excalidraw/excalidraw](https://excalidraw.com/)

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/<your-username>/AI_engineering_questions.git
cd AI_engineering_questions/webapp
npm install
```

### 2. Configure Environment Variables

Create `.env.local` inside the `webapp/` directory:

```bash
cp .env.example .env.local
```

Populate your Supabase project credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

### 3. Run Development Server

```bash
npm run dev -- -p 3000
```

Open [http://localhost:3000](http://localhost:3000) to start practicing!

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `j` / `k` or `↑` / `↓` | Navigate question list in Library |
| `↵` (Enter) | Start practice on selected question |
| `o` | View reference answer for selected question |
| `/` | Focus global search input |
| `Space` | Start / Pause interview timer |
| `r` | Restart interview session |
| `⌘↵` (Cmd+Enter) | Submit interview answer |
| `[` / `]` | Previous / Next chapter in Reader |
| `g` + `l` | Jump to Library |
| `g` + `c` | Jump to Concepts Roadmap |
| `g` + `p` | Jump to Progress |
| `g` + `v` | Jump to Videos |
| `g` + `g` | Jump to Glossary |
| `g` + `a` | Jump to Answers |
| `g` + `h` | Jump to Chapters (Handbook) |
| `?` | Toggle keyboard shortcuts modal |

---

## 📄 License

This repository is maintained for educational and interview preparation purposes.
Architecture chapter content is adapted from *System Design Interview – An Insider's Guide* by Alex Xu.
