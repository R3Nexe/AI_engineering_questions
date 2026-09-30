# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 14 (App Router) · Tailwind CSS · TypeScript · Excalidraw (whiteboard) · YouTube iframe API · next/font (Geist + JetBrains Mono).

## Users

**Primary:** Software engineers and engineering candidates — typically 2–8 YOE — preparing for system design, AI/ML systems, and machine learning engineering interviews. They study in focused desktop sessions (30–90 min) alongside docs, notebooks, and code editors. They are keyboard-native and distrust glossy tools.

**Secondary:** CS students and early-career engineers building foundations in distributed systems and AI infrastructure concepts before entering the job market.

## Product Purpose

AIPrep is a structured self-study tool for AI engineering and system design interview preparation. It provides a question bank with timer-driven practice sessions, an Excalidraw whiteboard for diagramming, self-graded reference answers, a concept mastery tree, a curated 102-term glossary across 8 technical categories, a YouTube video library, and a streak/heatmap progress dashboard. Success means a user can sit a live system design interview and speak fluently about tradeoffs — not just recall definitions.

## Positioning

The only study tool that combines a live resizable whiteboard inside the practice session, per-concept mastery tracking tied to individual questions, and a glossary purpose-built for AI/ML engineering vocabulary — as opposed to generic system design prep tools that ignore the ML stack.

## Operating Context

- Desktop-first; 13–27″ displays, typically in a dimly lit environment alongside multiple windows/tabs.
- Sessions are interrupted (notifications, context switches); the tool must restore state immediately.
- Users dictate answers aloud (microphone) or type into the answer textarea; the whiteboard is used in tandem.
- Keyboard shortcuts matter: users want to navigate the question list, start the timer, submit an answer, and reveal the reference without touching the mouse.
- The glossary and reference answers are consulted as reference material during study, not read linearly like documentation.

## Capabilities and Constraints

- Question bank with category, difficulty (easy/medium/hard), and mastery state (new / attempted / mastered).
- Per-question practice view: prompt, countdown timer, answer textarea with dictation, self-grade (1–5), submit/reveal flow.
- Resizable Excalidraw whiteboard panel; fullscreen mode for the whole practice view.
- Concept tree: categories → topics, with mastery fraction per topic.
- Glossary: 102 terms in 8 categories; A–Z navigation bar; related-term links; category filter.
- Reference answers: markdown-rendered, with functional/non-functional decompositions, common alternatives, and evaluation rubrics.
- Video library: YouTube embeds with 40 % sidebar for notes and a whiteboard; status (not started / partial / completed).
- Progress dashboard: streak, activity heatmap (GitHub-style), category mastery breakdown, "needs attention" list.
- No authentication; state in localStorage / Zustand store.
- No backend; all data from static JSON files in `/public`.

## Brand Commitments

Name: **AIPrep**. Tone: direct, technical, zero fluff. No taglines, no marketing copy, no emoji in UI chrome. Icons drawn from a single SVG library at consistent stroke weight.

## Evidence on Hand

- 10 confirmed route screenshots in `.verify/` and `.superdesign/tmp/current/`.
- AI-UI audit with 916 total detector findings documented in the detect report.
- Static JSON data for questions, glossary, videos, and concepts in `/public/`.

## Product Principles

1. **Speed over ceremony.** Every critical path — starting a session, seeing the answer, marking mastery — must be reachable in ≤2 keystrokes from any screen.
2. **Density over decoration.** The interface is a tool, not a stage. Ink that does not carry information is ink to remove.
3. **Mastery as the only number that matters.** Every screen's north star is "how many topics has the user mastered / total." All other metrics subordinate to this.
4. **Honest feedback, never gamified.** Self-grading surfaces the rubric; the tool does not hide difficulty or inflate progress.
5. **Keyboard as the primary modality.** Mouse is a fallback, not a requirement.

## Accessibility & Inclusion

WCAG 2.1 Level AA minimum for all text and interactive components. Keyboard navigation must cover all critical paths (question nav, timer control, answer submission, grade selection, tab switching). Focus indicators must be visible on the dark background. No content conveyed by color alone — all status states must have a text or shape complement.
