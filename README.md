# GlobalOnboard

GlobalOnboard is a hackathon MVP for LingoHack25 that helps HR teams create one English onboarding checklist and instantly preview how it looks for employees in Spanish, French, or Hindi. It combines the full Lingo.dev toolchain—CLI for static JSON, JavaScript SDK for runtime text, and CI automation—to showcase a practical multilingual workflow.

## Features
- **HR setup panel** – Edit the English source of company details, role, onboarding tasks, and a personal welcome message. Add or delete checklist items on the fly; new tasks stay in session state with unique IDs.
- **Employee preview** – Switch between `en`, `es`, `fr`, and `hi` to see localized UI labels and tasks. Custom tasks are translated with the Lingo JS SDK and cached, so every locale reflects the latest content.
- **Preview modes** – Toggle between the single-preview view or a QA mode that shows English vs. target locale side by side with localization health warnings for long translations. Overrides (Machine → Edited → Approved) apply to both template and custom tasks.
- **Translation feedback** – A spinner overlay appears on the Employee Preview whenever runtime translations (welcome note or custom tasks) are in progress, so HR knows content is still updating.
- **Runtime welcome note & task translation** – The welcome note and any user-added tasks stream through the Lingo JavaScript SDK so personalized edits are reflected immediately across locales.
- **Export onboarding packs** – Download the currently displayed locale as a `.doc` onboarding pack (company, role, tasks, welcome note) ready to hand off to new hires or HRIS workflows.
- **Lingo CLI + CI** – `i18n.json` config plus a GitHub Actions workflow keep `data/*.json` translations up to date whenever English source files change.
- **Tailwind-powered layout** – Single-page responsive layout with a gradient dark theme built with the Next.js App Router and Tailwind CSS.

## Tech Stack
- Next.js 16 (App Router, TypeScript)
- Tailwind CSS 4
- Lingo CLI + Lingo JavaScript SDK
- GitHub Actions for automation

## Getting Started
```bash
npm install
npm run dev
```
Visit http://localhost:3000 to load the GlobalOnboard workspace. The left column represents the HR authoring experience, while the right column shows the localized employee view.

## Runtime Translation Setup
The welcome note calls `/api/translate`, which wraps the Lingo JavaScript SDK via `lib/lingo.ts`. Provide a server-side API key (reused by the CLI) before running `npm run dev`:

```bash
export LINGO_DOT_DEV_API_KEY="<your-lingo-api-key>"
# Optional alias for the CLI name:
export LINGODOTDEV_API_KEY="$LINGO_DOT_DEV_API_KEY"
```

Without the key the preview will fall back to the English message and surface an error banner.

## Lingo CLI Workflow
Static localization lives under `data/`:

- `ui.en.json` – UI labels
- `onboarding_template.en.json` – Company, role, and tasks

Configure additional targets in `i18n.json` and run the CLI after editing the English source:

```bash
export LINGO_DOT_DEV_API_KEY="<your-lingo-api-key>"
npx lingo.dev@latest run
```

This updates `data/ui.{locale}.json` and `data/onboarding_template.{locale}.json` for all target locales. A GitHub Actions workflow (`.github/workflows/i18n.yml`) invokes `npx lingo.dev@latest ci --pull-request` on pushes to `main` that modify the English source or `i18n.json`, ensuring translations stay in sync via automated PRs.

## Project Structure
```
app/
  page.tsx          # HR + employee panels with locale switcher
  layout.tsx        # Root metadata + fonts
  globals.css       # Tailwind + design tokens
data/
  ui.*.json         # UI strings localized via Lingo CLI
  onboarding_template.*.json
lib/
  i18n.ts           # Typed helpers to load JSON per locale
  lingo.ts          # Lingo SDK instance + runtime translation helper
.github/workflows/
  i18n.yml          # GitHub Action running `lingo.dev ci`
i18n.json           # Localization bucket configuration
```

## Useful Scripts
- `npm run dev` – Next.js dev server
- `npm run build` – Production build
- `npm run lint` – ESLint via `eslint-config-next`

## Hackathon Notes
- All styles, data, and code were authored for this LingoHack25 MVP after the event kickoff.
- Replace placeholder API keys with your own Lingo credentials before running the CLI/SDK in production.
- Extend `SUPPORTED_LOCALES` inside `lib/i18n.ts` and re-run the CLI to add more languages or content buckets.
