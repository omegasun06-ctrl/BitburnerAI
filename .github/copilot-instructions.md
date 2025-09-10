# Copilot Coding Agent – Onboarding Guide

> **Read me first.** This repository contains player automation scripts for the game **Bitburner** written in **Netscript 2 (NS2) JavaScript**. The guidance below tells you *where to look*, *how to run and validate changes quickly*, and *what conventions to follow* so your PRs build and behave correctly the first time.

---

## 1) High‑Level Overview

**What this repo does**
- Automates early–to–late Bitburner gameplay tasks: target prep (grow/weaken), batch orchestration, server purchasing/upgrading, stock market strategies, and general utility helpers.
- Scripts are designed to be composable: a “master/orchestrator” coordinates worker scripts (hack/grow/weaken/stock/servers), typically with a shared **`utils.js`**.

**Tech stack / runtime**
- **Language:** JavaScript (NS2 style: `export async function main(ns) { ... }`).
- **Runtime:** Bitburner’s in‑game JS engine (browser runtime), not Node.js. No bundling required unless the repo includes a TS build pipeline.
- **Typical file patterns:** `*.js` modules with a single `main(ns)` entrypoint and optional helper exports.

**Repository size and layout**
- Expect a moderate number of top‑level scripts and subdirectories (e.g., `hacking/`, `stocks/`, `servers/`, `tools/`, `lib/`).
- A shared `utils.js` (or `lib/utils.js`) provides cross‑cutting helpers (logging, time/money formatting, RAM math, file/port helpers).

> **Agent directive:** Trust the procedures here first. Search the code only if a step is missing or fails.

---

## 2) Build, Run, and Validation

> Bitburner scripts typically need **no build step**. The critical path is syncing files into the game and executing them in the right order. If the repo includes TypeScript or a bundler, follow the **TS/Build** subsection below.

### A) Bootstrap (always do this first)
1. **Sync files to Bitburner** using one of these methods (pick the one present in the repo):
   - **`wget`** from raw GitHub:  
     `wget <raw-file-url> <dest-path>` (repeat per file or use a bootstrap script if present).
   - **Filesync tool / helper script:** If you see `bitburner-filesync` config or a `sync` script, run that per the README.
   - **In‑game `git-pull` style script:** If the repo includes a `git-pull.js` (or similar), run it once to pull/update all files.
2. **Verify NS2 format**: open one main script and ensure it uses `export async function main(ns) {}`.

**Preconditions:** You are in a Bitburner session with enough RAM to run coordinator scripts.  
**Postconditions:** All required `.js` files exist on `home` (or designated host) and are up to date.

### B) Run
- Identify the **entrypoint** (typically an orchestrator like `master_control.js`, `daemon.js`, `controller.js`, or similar).
- Run from the Bitburner Terminal:  
  `run <entrypoint>.js --help` *(if supported)*, otherwise `run <entrypoint>.js [args...]`.
- Common flags: `--target`, `--max-batches`, `--reserve-ram`, `--stock`, etc. Check file header comments or the top constants for defaults.

### C) Test / Quick Validation
- **Dry‑run / help:** Prefer `--help` mode where implemented.
- **Smoke checks:**
  1. **Target prep** script runs without throwing; security decreases over time (`ns.weaken`) and money grows (`ns.grow`).
  2. **Batch controller** schedules hack/grow/weaken with correct timing gaps; no “insufficient RAM” spam; no desync warnings.
  3. **Server upgrader** buys/renames/levels consistently; does not delete stronger servers unintentionally.
  4. **Stock manager** respects allocation caps (e.g., ≤ 50% of funds) and per‑symbol minima.
- **Logs:** Use `tail <script>.js` to watch for runtime errors and parameter echo.

### D) Lint / Formatting (if present)
- If `.eslintrc*` or `.prettierrc*` exist, run the documented scripts locally (e.g., `npm run lint`, `npm run format`).  
  If no Node toolchain exists, keep code consistent with existing style: 2‑space indent, semicolons consistent with the repo, and no Node‑specific globals.

### E) TS/Build (only if you see TypeScript)
- If the repo includes `package.json` and `tsconfig.json`:
  1. **Always** run `npm ci` (or `npm install`) before building.
  2. Build: `npm run build` (expect output in `dist/` or `out/` mirrored to Bitburner file names).
  3. Sync the generated `.js` to Bitburner (not the `.ts`).
- **Common pitfalls:**  
  - Browser/Bitburner lacks Node built‑ins—avoid `fs`, `path`, etc., in runtime code.  
  - Keep modules small; RAM usage scales with script size/import graph.

> **Timing:** First‑time `wget`/sync is near‑instant per file. Large TS builds can take seconds; avoid repeated clean builds unless necessary.

---

## 3) Project Layout & Where to Make Changes

> This section helps you jump to the right file with minimal searching.

**Likely high‑value directories and files**
- **`utils.js` or `lib/utils.js`** – shared helpers (formatting, logging, retry wrappers, RAM math, scanning, JSON ports).  
  - If adding new helpers, keep them **pure** or pass `ns` explicitly; avoid hidden global `ns`.
- **Orchestrator** (e.g., `HACKMaster.js`, `STOCKMaster.js`) – target selection, batch scheduling, worker deployment.
- **Hacking workers** – `hack.js`, `grow.js`, `weaken.js` with minimal overhead and consistent parameter handling.
- **Target prep** – `prime_target.js` or similar: drives server to min security & max money.
- **Servers** – purchasing/upgrading scripts; ensure pricing thresholds and equal‑RAM policies are respected.
- **Stocks** – manager/strategy scripts; enforce global cash cap (e.g., ≤50%), per‑stock min allocation, and sell/hold rules.

**Configs & constants**
- Look for `config/*.json`, `constants.js`, or top‑of‑file `const SETTINGS = {...}` blocks.  
- Update defaults *here* rather than scattering literals across scripts.

**GitHub workflows / CI**
- If a `.git/workflows/` folder exists, open the YAML files to see lint or static checks.  
- If no CI is present, validate by:  
  1) running orchestrator with `--help`,  
  2) smoke‑testing a single target, and  
  3) observing logs for one full hack cycle.

**Conventions to follow**
- **Entry:** Each script exports a single `async function main(ns)`.  
- **Imports:** Prefer relative imports to shared helpers; avoid circular imports.  
- **Logging:** Use a centralized logger (often in `utils.js`) to keep logs quiet but actionable.  
- **RAM discipline:** Keep workers tiny; push heavy logic to the orchestrator.  
- **Determinism:** Don’t depend on wall‑clock timers outside Bitburner’s scheduling (use `ns.sleep` and computed delays).  
- **Feature flags:** Add booleans or args for expensive features (e.g., stocks) so users can toggle easily.

---

## 4) Pre‑PR Checklist (avoid rejected PRs)

- ✅ **No broken imports** (case‑sensitive paths).  
- ✅ **No Node‑only APIs** in runtime code.  
- ✅ **Respects allocation caps** (money, RAM, threads).  
- ✅ **No infinite loops without `await ns.sleep(...)`**.  
- ✅ **Orchestrator help/usage text** reflects new args or behavior.  
- ✅ **Batch timings** (weaken/grow/hack gaps) computed from `ns.getGrowTime`/`ns.getWeakenTime`/`ns.getHackTime` consistently.  
- ✅ **Server upgrader** won’t delete stronger servers unintentionally; confirm with a dry run log.  
- ✅ **Stocks**: Never exceed the global funds cap; don’t over‑buy illiquid symbols.  
- ✅ **Tail logs** show healthy cycles for at least one target after changes.

---

## 5) When to Search vs. When to Trust This File
- **Trust this file first.** Only search (`grep`, code search, etc.) if:  
  - The entrypoint is unclear after checking `README` and top‑level scripts, or  
  - The repo includes TypeScript/build tooling not covered here, or  
  - Commands in this guide fail due to missing files (then open `README`/scripts to confirm the exact names).

*Thank you for following these guidelines—keeping to them helps ensure your changes run cleanly in Bitburner and are easy to review and accept.*
