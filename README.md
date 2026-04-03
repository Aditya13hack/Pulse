# Pulse — Personal Finance Dashboard

## Overview

Pulse is a single-page finance dashboard built for individuals who want clarity over their financial activity, presented through a rare, hand-crafted, and highly engaging UI. Going beyond standard enterprise tools, Pulse uses advanced visual techniques—animated mesh gradients, SVG noise textures, layered glassmorphism, and subtle micro-interactions—to create a "living" interface. It tracks income, expenses, category breakdowns, savings goals, and monthly budgets through a carefully considered design system that prioritizes a premium, out-of-the-box aesthetic.

The decision to build Pulse with React and Zustand, rather than a more opinionated framework, was deliberate. Zustand's minimal API surface makes state predictable and serializable, which matters in a finance app where derived values (filtered totals, category aggregates, savings rates) must always reflect truth. Framer Motion was chosen over CSS-only transitions because the animation requirements — shared layout IDs for the nav dot, `AnimatePresence` for page crossfades, staggered card reveals, and dynamic data visualizations — require a runtime that understands the component tree. JetBrains Mono powers the numerical tabular layouts, keeping horizontal alignment consistent across live value updates.

---

## Getting Started

> Node 18+ is required.

```bash
git clone https://github.com/your-username/pulse-finance.git
cd pulse-finance
npm install
npm run dev
```

---

## Features

### Dashboard

The Dashboard is designed to be visually arresting and instantly readable. Set against an animated background mesh with floating, gradient orbs (in both Dark and Light modes), it features a full-width hero zone with an individualized greeting and a dynamic net balance countdown. A "Financial Health" score ring gives users an immediate grade based on their savings habits. Below it, three summary cards show total income, total expenses, and savings rate—each glowing with neon sparklines and fluid progress rings. Further down, users will find a balance-over-time area chart with an interactive time range picker, along with a "Recent Activity" timeline displaying merchant avatars and category emojis. At the bottom, an "Activity by Day" pulse chart highlights weekly spending volume.

### Transactions

The Transactions page is the most interactive surface in the app. A sticky glass filter bar—pinned below the navigation as users scroll—offers full-text merchant search, a multi-select category popover, type and month dropdowns, and an amount sort toggle. The transactions themselves have been reimagined as rich, expandable cards that open on click or hover to reveal deeper context (timestamps, exact dates, granular category data, and dynamic UI elements like "Spend Intensity" calendars and KPI sparklines).

In Admin mode, this page unlocks inline edit and delete actions. Emphasising a robust UX, deletion requires a two-step confirmation with the row responding visually in a high-visibility danger state. New transactions can be added via the slide-in drawer, accessible from the header button or the `n` keyboard shortcut.

### Insights

The Insights page surfaces patterns utilizing next-level data visualization. It opens with AI-powered insight banners that highlight crucial spending metrics (e.g. "Your largest spend category is Food..."). Six analytical cards are arranged in a two-[column grid, each revealing itself dynamically as it scrolls into the viewport. The cards cover: Biggest Spend category with merchant breakdowns, Month vs Last Month bar charts, Weekly Spending distribution, a leaderboard for Top Merchants, a six-month trend line, and a centralized Savings Goal progress ring. A comprehensive Monthly Budgets list displays per-category spend versus configurable limits, actively responding with warning badges and over-budget modals if thresholds are breached.

### Role-Based UI

Pulse ships with two roles — Viewer and Admin — switchable from the avatar dropdown in the navigation. Viewer mode provides full read access to all data but hides all mutation controls: the Add Transaction button does not render in the DOM, edit and delete icons never appear on rows, and the budget editor is locked. Admin mode unlocks all CRUD surfaces and adds the CSV export button to Insights. Switching roles fires a contextual toast notification and persists the choice across page refreshes via localStorage. No authentication system is implemented — this is a frontend-only demo.

---

## Architecture & Data Flow

State in Pulse lives entirely in a single Zustand store configured with the `persist` middleware, which serialises the transactions, role, budgets, and active filters slices to `localStorage`. This means the app resumes exactly where the user left off after a refresh. Crucially, no derived data is held in the store. Every computed value — filtered transaction lists, category totals, monthly aggregates, savings rates — is calculated dynamically at the component level using `useMemo` hooks in a central `derive.js` utility file, keeping the store a pure source of truth.

---

## Tech Stack

| Library | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| Vite | 5 | Build tool |
| Tailwind CSS | 4 | Utility styling in harmony with standard `index.css` |
| Zustand | 4 | State management, pure and persistent |
| Framer Motion | 11 | Powerful fluid animations and page transitions |
| Recharts | 2 | Responsive SVG data visualization |
| Lucide React | latest | Light-weight, consistent iconography |
| React Router | 6 | Declarative client routing |

---

## Design System

The app utilizes a "Rare, Hand-Crafted" design approach, moving beyond standard SaaS templates. The custom themes (Dark and Light) feature `backdrop-blur(16px) saturate(120%)` glass effects, deep shadowing (`box-shadow` layers), and theme-aware radial gradients. Category colors are fixed design tokens defined in the CSS `:root` block to ensure perfect consistency across every view or visualization—if Food is orange in a pie chart, it remains orange in a transaction icon or a filter chip. Both Light and Dark modes preserve exactly the same level of UI fidelity, textures, and fluid motion, showcasing the full capabilities of modern frontend engineering.

---

*Built as part of a frontend engineering internship screening. Designed to stand apart.*
