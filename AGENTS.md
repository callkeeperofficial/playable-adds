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
- `chicken-pilot/`

When adding another playable, create a new top-level directory rather than
replacing or folding it into an existing game.

## Isolation Requirement

Do not modify one playable while working on another. Game behavior, source
assets, visual assets, audio, UI, and runtime code changes must stay inside the
owning top-level game directory.

For the current `chicken-pilot` work, do not change `chicken-road/`,
`chicken-crash/`, or `chicken-road-unfinished/`. Only shared repository files
such as this guide, README entries, the root Pages index, or the GitHub Pages
workflow may be updated when they are needed to register or publish a playable.

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
- For any visual, layout, canvas, interaction, or gameplay change, verify the
  affected playable at both desktop and mobile viewport sizes before considering
  work complete. Mobile verification must include a narrow phone-sized viewport,
  not only desktop browser resizing.

## Runtime Asset Loading

Avoid leaky asset loading. A playable must not repeatedly request the same
static runtime asset because UI, canvas, or audio objects are recreated during
normal state updates.

Before considering asset-related UI, audio, or scene work complete:

- Check that DOM renders do not recreate stable images, videos, canvases, or
  other media elements on every state update.
- Check that sound playback does not create new `Audio` elements or trigger
  repeated network requests for the same sound during normal gameplay.
- Prefer stable DOM shells, cached image/video references, PixiJS asset caches,
  and one-time decoded audio buffers over rebuilding media nodes in render
  loops.
- Verify the browser Network panel or an equivalent request counter for obvious
  repeated requests to static files such as logos, sprites, atlases, videos, and
  audio files.

## Local Development

Run each playable from its own directory with a fixed port so browser checks
remain predictable.

Reserved local ports:

- `chicken-road`: `http://localhost:5173/`
- `chicken-crash`: `http://localhost:5174/`
- `chicken-road-unfinished`: `http://localhost:5175/`
- `chicken-pilot`: `http://localhost:5176/`

Example for Chicken Crash:

```sh
cd chicken-crash
npm run dev -- --host 0.0.0.0 --port 5174
```

Use the local Vite server for iterative visual verification. Verify
representative desktop and mobile widths, including both sides of any specified
breakpoint. Do this even when the change looks desktop-only, because shared
canvas, header, and controls changes often affect mobile layout.

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
https://callkeeperofficial.github.io/playable-adds/chicken-pilot/
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
  chicken-pilot/
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

## Publication Final Response

After saving and publishing changes, the final response must clearly report the
publication result instead of only mentioning the playables that were most
recently edited.

Include:

- The commit SHA and commit title for every commit created during the publish
  sequence.
- The pushed branch and remote.
- The GitHub Actions Pages workflow status, including a link to the successful
  run when available.
- The local build or verification commands that were run.
- Whether the working tree is clean after the push.
- Every published playable URL, not only the changed projects:

```text
https://callkeeperofficial.github.io/playable-adds/chicken-road/
https://callkeeperofficial.github.io/playable-adds/chicken-crash/
https://callkeeperofficial.github.io/playable-adds/chicken-road-unfinished/
https://callkeeperofficial.github.io/playable-adds/chicken-pilot/
```

- The root Pages index URL:

```text
https://callkeeperofficial.github.io/playable-adds/
```

When possible, verify the root index and every playable URL with an HTTP check
after deployment, and mention the status codes in the final response.
