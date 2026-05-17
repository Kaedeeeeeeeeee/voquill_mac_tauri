# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Note: `CLAUDE.md` is a symlink to `AGENTS.md`. Edits here are shared with any other agent tooling that reads `AGENTS.md`.

** Rules **

- Do not propose band-aid fixes to problems. Identify the root cause, be it architectural or logical, and address it directly. Don't be afraid to remove broken code. If something is broken, fix it at the root, even if that means refactoring and overhauling systems (if necessary).
- Enforce DRY code principles. If you find yourself copying and pasting code, stop and refactor it into a reusable function or module.
- Avoid over-engineering. Implement solutions that are as simple as possible while still meeting requirements.
- Your changes should have minimal impact. Do not break existing functionality.
- Write clear, maintainable code that is self documenting. Do not comments on new code except where it's necessary to explain non-obvious things.
- Prefer to follow existing patterns such as dialogs, state management, and API interactions, etc.

** Repository structure **

- Turborepo monorepo managed with pnpm (`packageManager: pnpm@10.11.0`, Node >= 18). Workspaces: `apps/*`, `apps/firebase/functions`, `packages/*`, `enterprise/*` (see `pnpm-workspace.yaml`).
- Root scripts (proxied through Turbo): `pnpm run build`, `pnpm run lint`, `pnpm run check-types`, `pnpm run test`, `pnpm run dev`, `pnpm run format`.
- Shared packages in `packages/` (e.g. `types`, `functions`, `utilities`, `voice-ai`, `pricing`, `agent`, `desktop-utils`, `desktop-native-apis`, `firemix`, `eslint-config`, `typescript-config`). They compile to `dist/` — after editing `packages/types` or `packages/functions`, rebuild them (`pnpm --filter @voquill/types build`) before downstream consumers see changes.
- Regenerate Rust↔TS bindings with `pnpm run gen:bindings` (root) — proxies to `@voquill/desktop-native-apis`.
- i18n: use `<FormattedMessage defaultMessage="..." />` or `useIntl()` — never pass an `id` prop. Apps with translations have their own `pnpm run i18n` (extract + sync via `babel-plugin-formatjs`).

** `apps/desktop` — Tauri desktop app (Rust + TypeScript/React) **

- "Rust is the API, TypeScript is the Brain" — all business logic lives in TypeScript, never duplicated in Rust. Rust (`src-tauri/`) provides pure API capabilities (audio capture, keyboard injection, SQLite, Whisper, encryption, GPU enumeration, filesystem) without decision-making.
- Single source of truth for state is Zustand (with Immer) in TypeScript (`src/store/`, `src/state/`).
- Data flow: User/Native Event → Actions (`src/actions/`) → Repos (`src/repos/`) → Tauri Commands (`src-tauri/src/commands.rs`) → SQLite/Whisper/APIs.
- Repos abstract local vs remote: `BaseXxxRepo` defines interface, `LocalXxxRepo` / `CloudXxxRepo` implement. Use `toLocalXxx()` / `fromLocalXxx()` at the Tauri boundary.
- Database migrations go in `src-tauri/src/db/migrations/` as `NNN_description.sql`, registered in `db/mod.rs`.
- New Tauri commands: define in `commands.rs`, register in `app.rs` invoke_handler, create a repo, use in actions.
- Dev (run from `apps/desktop/`, not `turbo dev` — the app owns its own watcher):
  - `pnpm run dev` — auto-detects platform via `scripts/select-platform-dev.mjs`.
  - `pnpm run dev:mac` / `pnpm run dev:windows` / `pnpm run dev:linux` — explicit platform.
  - Override detection with `VOQUILL_DESKTOP_PLATFORM` (`darwin` / `win32` / `linux`).
  - Default dev flavor is `emulators` (uses Firebase emulator suite). Pass `FLAVOR=dev` / `VITE_FLAVOR=dev` for the hosted dev project; `VITE_USE_EMULATORS=true` forces emulators.
- Build/test: `pnpm run build`, `pnpm run lint` (prettier + oxlint), `pnpm run test` (vitest), `pnpm run test:unit`, `pnpm run test:integration`, `pnpm run test:evals`, `pnpm run test:webdriver`. Single test: `pnpm vitest run path/to/file.test.ts` (or `-t "name"` for a single case).
- Prod-mode run: comment `devUrl` in `src-tauri/tauri.conf.json`, then `pnpm run build && VITE_FLAVOR=prod npx tauri dev --no-dev-server`.

** `apps/docs` — Astro Starlight documentation site **

- `pnpm run dev` (port 3490), `pnpm run build`, `pnpm run check-types` (`astro check`). No lint configured. Deployed via Firebase Hosting (`firebase.json`).

** `apps/windows-installer` — Tauri-based Windows installer **

- `pnpm run dev` / `pnpm run build` / `pnpm run tauri:build`.

** `enterprise/gateway` — Enterprise API gateway (Express + Postgres) **

- Handler pattern: if-else chain in `src/index.ts`. Bundled with esbuild to `dist/index.js`.
- `pnpm run dev` (nodemon + esbuild rebuild loop), `pnpm run build`, `pnpm run check-types`, `pnpm run test` (vitest: `test:unit`, `test:component`, `test:integration`).
- Local Postgres via `enterprise/docker-compose.yml`; reset with `enterprise/reset-db.sh`. SQL migrations live in `src/db/migrations/`.

** `enterprise/admin` — Enterprise admin dashboard (Vite + React) **

- Follows STT provider pattern for new provider types (state, actions, tab, dialog, side effects).
- `pnpm run dev`, `pnpm run build` (`tsc -b && vite build`), `pnpm run lint`, `pnpm run i18n`.

** `mobile/` — Flutter mobile app **

- Flutter project at repository root (`mobile/`), not inside `apps/`. Standard `flutter run` / `flutter build`.
- Uses `flutter_zustand` and `draft` for state management, following similar patterns as the desktop app.
- Regenerate generated code with `./mobile/generate.sh`.

** Environment / key variables **

- `VOQUILL_API_KEY_SECRET` — desktop disk-encryption key for stored API keys (`src-tauri/src/system/crypto.rs`).
- `VOQUILL_WHISPER_MODEL_URL[_<SIZE>]` — override Whisper model download locations.
- `VOQUILL_WHISPER_DISABLE_GPU` — force CPU inference for debugging.
- `VITE_USE_EMULATORS=true` — point desktop at Firebase emulators.
- `GROQ_API_KEY` — Groq transcription/cleanup.

** Releases **

- Orchestrated by `.github/workflows/release.yml` — detects changed folders and invokes per-component reusable workflows. Pushes to `main` / `prod` / `enterprise` release to the `dev` / `prod` / `enterprise` channels. Desktop builds bump a channel tag, build all three platforms, and publish assets plus `latest.json` manifests. See `docs/desktop-release.md`.
