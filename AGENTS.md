# Playable Adds Repository Guide

Read this file before changing any playable project or repository pipeline.
Game-specific requirements belong in each game's own `AGENTS.md`.

## Repository Purpose

This repository contains multiple standalone browser playable games. Each game
lives in its own top-level directory and must remain independently buildable.

Current playable projects:

- `chicken-road/`
- `chicken-crash/`
- `chicken-road-unfinished/`

When adding another playable, create a new top-level directory rather than
replacing or folding it into an existing game.

## Project Conventions

- Use Vite for local development and production builds.
- Keep each playable's `package.json`, lockfile, source files, runtime assets,
  and `dist/` output inside that playable's directory.
- Keep Vite asset paths compatible with subdirectory hosting. Prefer a relative
  Vite base such as `./`.
- Keep game-specific source assets and visual references inside the owning game
  directory.
- Read the local `<game>/AGENTS.md` before implementing or changing a game.
- Run the production build for the affected playable before considering work
  complete.

## Local Development

Run each playable from its own directory with a fixed port so browser checks
remain predictable.

Reserved local ports:

- `chicken-road`: `http://localhost:5173/`
- `chicken-crash`: `http://localhost:5174/`
- `chicken-road-unfinished`: `http://localhost:5175/`

Example for Chicken Crash:

```sh
cd chicken-crash
npm run dev -- --host 0.0.0.0 --port 5174
```

Use the local Vite server for iterative visual verification. For responsive
playables, verify representative desktop and mobile widths, including both
sides of any specified breakpoint.

## GitHub Pages Publishing

The repository remote is:

```text
git@github-work:callkeeperofficial/playable-adds.git
```

GitHub Pages must publish all playable games side by side. Each production build
is available through a final directory named after its playable:

```text
https://callkeeperofficial.github.io/playable-adds/chicken-road/
https://callkeeperofficial.github.io/playable-adds/chicken-crash/
https://callkeeperofficial.github.io/playable-adds/chicken-road-unfinished/
```

The repository root may contain a simple index with links to every playable:

```text
https://callkeeperofficial.github.io/playable-adds/
```

## Deployment Pipeline

The GitHub Pages workflow lives at:

```text
.github/workflows/deploy-pages.yml
```

The workflow must:

1. Build every playable independently.
2. Install each playable's dependencies using its lockfile.
3. Run each playable's production build.
4. Create one temporary Pages bundle.
5. Copy every `dist/` into a matching final directory:

```text
pages-bundle/
  chicken-road/
    index.html
    assets/
  chicken-crash/
    index.html
    assets/
  chicken-road-unfinished/
    index.html
    assets/
```

6. Optionally add a root `pages-bundle/index.html` that links to all games.
7. Upload the shared `pages-bundle/` directory as the GitHub Pages artifact.
8. Preserve the Pages permissions and deployment job.

When a playable is added, extend the shared bundle. Do not remove previously
published games.

## Pipeline Verification

Before considering a deployment change complete:

- Build every playable locally.
- Confirm relative assets load correctly from each final subdirectory.
- Confirm the workflow uploads the shared Pages bundle.
- Verify each published game at its final GitHub Pages URL after deployment.
