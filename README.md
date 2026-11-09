# Shareship — Collaborative App for Couples & Families

Shareship is a collaborative web and mobile application for couples and family partners to sync calendars, expenses, and memories.

## Architectural Overview

- **Frontend**: Angular 22 (Standalone Components, Signals, Reactive Architecture) + Ionic Framework with Capacitor for native iOS/Android mobile builds.
- **Styling**: Tailwind CSS v4 mapped strictly to Design Tokens in `Design/DESIGN.md` (warm cream canvas `#f2fcf5`, primary sage `#466557`, charcoal text `#151d1a`, Plus Jakarta Sans typography).
- **Backend**: Node.js with Fastify (high-performance, low-overhead HTTP & WebSocket engine) located in `/backend`.
- **Real-Time Sync Engine**: WebSocket synchronization protocol (`/ws/sync`) that differentiates data inputs and presence between "Me" (Jamie) and "Partner" (Alex).

---

## Screen 1: Login & Space Connection Screen (`screen.png`)

Adheres strictly to the visual layout and design tokens from `DESIGN.md`:
1. **Header & Navigation Bar**:
   - Brand logo mark with `"Shareship Logo"` text.
   - Pill-shaped status badge `"● Synced"` with soft green background and sage dot.
   - Notification bell icon and user avatar with golden/sage gradient ring.
2. **Hero & Welcome Section**:
   - Ambient circular container holding the sage-green heart icon (`#59786a`).
   - Headline: *"Welcome to Shareship"* (`Plus Jakarta Sans`, 600 weight, charcoal text `#151d1a`).
   - Subtitle: *"Your shared calendar, expenses, and memories, beautifully synchronized."*
3. **Partner Connection Status Card**:
   - Rounded container (`surface-container-low`: `#ecf6f0`).
   - Circular avatar `"A"` with live green status indicator dot.
   - Text: `"Linked with Alex"` and `"Live Sync Active"` with animated pulsing dot.
   - Right-aligned PNG document badge button.
4. **Authentication Mode Switcher**:
   - Segmented toggle control: `"Sign In"` (active white pill with subtle elevation) vs `"Create Space"` (ghost style).
5. **Form Elements**:
   - Email Address Input: Soft input container (`#ecf6f0`, `#dbe5df` border) with envelope icon and placeholder `alex.and.jamie@example.com`.
   - Password Input: Matching soft container with lock icon, masked bullets, and visibility toggle.
   - Primary Action Button: Full-width solid sage-green button (`#466557`, rounded-xl, white text) reading `"Continue to Shared Space →"`.
   - Divider: Centered `"or continue with"` between subtle horizontal rules.
   - Social Login Buttons: Side-by-side pill buttons for **Google** (official 4-color SVG) and **Apple** (official SVG).
6. **Footer**:
   - Centered micro-copy: `"Made with warm hugs for partners ♡"` with soft heart outline.
7. **Bottom Tab Bar**:
   - Fixed navigation with 4 tabs: **Home** (active sage pill container), **Calendar**, **Expenses**, and **Notes**.
8. **Interactive Real-Time Sync Inspector**:
   - Clicking the Partner Card or the `"● Synced"` badge opens a live synchronization sheet illustrating bidirectional "Me vs Partner" updates, connection latency, and live simulations.

---

## Getting Started

### Prerequisites
- Node.js >= 18 (Tested on v24.18)
- npm >= 10

### 1. Run Fastify Sync Backend
```bash
cd backend
npm run dev
# Server runs at http://localhost:3001
# WebSocket endpoint at ws://localhost:3001/ws/sync
```

### 2. Run Angular Frontend
```bash
cd frontend
npm start
# App runs at http://localhost:4250 or http://localhost:4200
```

### 3. Native Mobile Compilation (Capacitor)
```bash
cd frontend
npm run build
npx cap add ios     # Add iOS Xcode project
npx cap add android # Add Android Studio project
npx cap sync        # Sync web bundle into native projects
```
