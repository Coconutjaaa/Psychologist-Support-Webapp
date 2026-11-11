# MindLink

Prototype web app for psychologists and their patients: a Knowledge Graph built from session transcripts, a chat that answers questions from that graph, and a patient app for mood check-ins. React 19 + Vite 8 + TypeScript, plain CSS. UI text is Thai.

## Commands

- `pnpm dev` (port 8443) · `pnpm build` · `pnpm preview` · `pnpm typecheck`
- pnpm is not installed on the owner's machine: run the same scripts with `npm run <script>` (node_modules is already installed; install with `npx pnpm@10 install`, never `npm install`).
- Docker: `docker compose up --build` (nginx on port 8090)
- GitHub Pages: `.github/workflows/deploy-pages.yml` builds and publishes on every push to `main`, with `BASE_PATH=/<repo>/` (read as Vite `base` in `vite.config.ts`) and the demo settings from `.env.example`. Use relative or imported asset URLs, never root-absolute `/...` paths in code.
- Run `pnpm typecheck` and `pnpm build` after changes.

## Structure

```
src/
  main.tsx, App.tsx      entry; App picks Login, ClinicianApp or PatientApp from the session
  config.ts              app name, VITE_API_URL, `features` switches, demo people (names + .env credentials, mock only)
  types.ts               domain types shared by UI and API: the data shapes a backend must send
  api/
    index.ts             exports `api` — the mock or the HTTP client, chosen by VITE_API_URL
    contract.ts          `Api` interface: every backend call, with its REST endpoint; ApiError
    http.ts              REST client (fetch, JSON, Bearer token)
    session.ts           signed-in user (sessionStorage + memory)
    mock/                browser-only backend: index.ts (Api over localStorage), seed.ts (demo data),
                         transcripts.ts (session transcripts), summaries.ts (session key-point summaries),
                         rag.ts (KG question answering), storage.ts
  components/            shared UI: Icon, Modal, Toast (+ useApiAction), LoadState, Header, SettingsModal
  hooks/                 useResource (load API data), usePersistentState (UI prefs), useDismiss
  lib/                   date.ts, labels.ts (role/mood labels, node tones, initials), download.ts (.ics)
  features/
    auth/                Login (sign in / sign up)
    clinician/           ClinicianApp (data + dialogs), nav rail, patient list, dashboard, schedule, modals
    workspace/           one patient's case: PatientWorkspace, tabs, KgChat, KnowledgeGraph (+ graphLayout.ts), TranscriptModal
    patient/             PatientApp, MoodCheckin, CheckinChat, PatientSidebar, dialogs, moodStats.ts
  assets/logo-mark.png   logo mark shown by components/Brand (header, login)
  index.css              all styles; table of contents at the top
public/                  favicon.ico, apple-touch-icon.png, robots.txt (served as-is)
```

Brand: the logo is navy "Mind" + teal "Link" (`--navy`, `--brand-teal`); accents use the `--teal-*` tints. Keep new colours in that family — blue hues were retired with the old brand.

## Rules

- **Data goes through `api` only.** Components never touch localStorage or `fetch` for app data. To add a backend call: add it to `Api` in `api/contract.ts` (with its endpoint), then implement it in `api/http.ts` and `api/mock/index.ts`. `tsc` fails until both exist.
- Load data with `useResource(() => api.x.list(id), [id])`; render `<LoadState resources={[...]} />` until `data` is set. After a mutation, update local state with `resource.mutate(...)` using what the API returned.
- Run mutations with `useApiAction()` from `components/Toast`: `run(() => api.x.save(input), (saved) => { ...; notify("...") })`. It shows an error toast on failure.
- Shared data shapes live in `types.ts`. UI-only types stay in their component file.
- Each component is a default export in its own file. Shared pieces go in `components/`, feature-specific ones in their `features/*` folder.
- Styles are plain CSS classes in `src/index.css` (Tailwind is imported for its base reset only). Use the colour tokens in `:root`; add rules to the matching section, keeping cascade order in mind.
- Strings containing apostrophes use double quotes. Keep Thai UI copy consistent with existing screens.
- `.env` values prefixed `VITE_` are public in the built site — never put real secrets there.
- Appointments are switched off (`features.appointments` in `config.ts`) because they are not in the current requirements. Their code stays; any new appointment UI must also check that flag.
