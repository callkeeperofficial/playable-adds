# Penalty Cup Guide

- Follow the repository-level `AGENTS.md`.
- This playable is mobile-first and uses PixiJS v8, Vite, TypeScript, and the official Spine Pixi v8 runtime.
- Never crop, slice, repack, or manually animate files under `public/assets/spine/`.
- Keep the normal penalty and bonus state machines deterministic enough to test, while retaining local random outcomes during play.
- Verify production build plus 390x844 mobile and a desktop viewport after visual changes.
- Use local port `5177` for development.
- Verify this project only by opening its Vite port in a regular browser. Do not launch iOS Simulator, system GUI apps, or alternate device runtimes for QA.

## Required Planning Workflow

- Do not begin implementation until a concrete plan has been written, presented to the user, discussed, and explicitly approved.
- Create a fresh plan for every implementation request, even when the requested change appears small or continues earlier work.
- The plan must identify scope, files or systems affected, verification steps, and any unresolved decisions.
- After approval, work strictly in the agreed plan order. Do not add unapproved features, refactors, or scope.
- Keep plan statuses current while working and stop for renewed discussion if implementation needs a material deviation from the approved plan.
- Analysis, inspection, and plan preparation are allowed before approval; source or runtime implementation changes are not.
