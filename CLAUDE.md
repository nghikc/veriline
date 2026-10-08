# CLAUDE.md

Briefing for contributors to **Veriline** (core, MIT). A **briefing**, not a journal: keep it under the byte cap `claude.max` (lint check 28). The *why* behind core design choices lives in **`docs/decisions/README.md`**.

## What this repo is

**Not an application** — a collection of Claude Code skills: `.claude/skills/`, 49 skills (35 `ba-*` + 11 `dev-*` + 3 `ac-*`) turning a raw idea → Vietnamese BA docs → build plan → real code, with an independent verification gate before anything is called done. "Running" a skill = `/<skill-name>` in a Claude Code session; editing a skill = editing its `SKILL.md` prompt + companion files. Generated docs are **Vietnamese** and land in the consuming project's `docs/`; `example/docs/` (TeamTasks) is the end-to-end fixture every checker runs against.

## Skill anatomy

```
<skill>/
├── SKILL.md      # required — YAML frontmatter (name, description) + instructions; the ONLY file at the root
├── scripts/      # executable code — every CLI lives here
├── references/   # what the skill READS to decide (conventions, rules/, subagent prompts)
└── assets/       # what gets COPIED or filled in (templates, seeds, vendor/)
```

`description` begins `Use when …` (auto-trigger), ≤230 chars, total budget checked (check 25); "differs from skill X" goes in a `## Ranh giới` section. Every pipeline skill ends by pointing at `ba-next` (check 26). `.claude/skills/ba-toolkit/references/conventions.md` (+ its `conv-*.md` parts) is the **single source of truth**; the ```registry block in `conv-registry.md` is what `lint.js` checks.

## Skill families

- **`ba-*` atomic** — one pipeline step (`ba-requirements`, `ba-functions`, `ba-screens`, `ba-screen-spec`, `ba-test`, `ba-html-design`, `ba-build`…).
- **`ba-*` orchestrators** — one trigger runs a whole chain with a `ba-review` gate between steps (`ba-discover`, `ba-init`, `ba-add-screen feature`, `ba-accept`…).
- **`ba-*` utilities** — `ba-next` (single entry point), review/track/trace/portal/export.
- **`dev-*`** — code discipline (TDD, debugging, plans, verification), adapted from superpowers (MIT, see `THIRD_PARTY_NOTICES.md`).
- **`ac-*`** — verification and review: `ac-verify` (fresh verifier, mutation testing), `ac-judge` (evidence-based diff review), `ac-audit-web`, `ac-agent`.

Pipeline order and every skill's role: `.claude/skills/ba-toolkit/SKILL.md`. Business-language explanations: `explain/`.

## Conventions to preserve when editing skills

- **`docs/Ho-so/`** holds everything that is not the product spec; `docs/` root keeps the numbered spec files (`01/02/03/05/06/07/10/11/12`), `Screen-spec/`, `00-tracking.md` and the ledgers. Numbered files keep their numbers. **Scripts never hardcode either location** — they resolve through `ba-toolkit/scripts/docpath.js`.
- **E2E specs live outside `docs/`** at `e2e/tests/<Code>-<Name>.spec.ts` (`e2epath.js`); a test name spells out **every** `TC-S..` id it covers.
- **Screen folder** `docs/Screen-spec/[<Group>/]<Code> - <Name>/`; a group folder only when it holds ≥2 screens.
- **ID chain** `BR → StR → FR/NFR → F → S → R-S → UC/US → TC` — every ID-emitting skill follows it.
- **Tracking matrix** `00-tracking.md`: one row = one screen; the `dev` column is owned by `dev-run`, `ba-track/scripts/refresh.js` preserves it.
- **Ledgers**: `00-cr.md` (change requests, baseline changes, rows never deleted) · `00-backlog.md` (work items) · `00-decisions.md` (questions only a human can answer).
- **Role flows use Mermaid `swimlane-beta`**, never `flowchart`; >8 nodes or ≥4 lanes → `TD`; Vietnamese labels **carry diacritics** (only node IDs are ASCII).
- **Plan gate** (`Cổng phương án`): orchestrators and multi-file skills present a plan and wait for approval before writing (canon `gate.plan.skills`, check 11).
- **Project profile** `full`/`lite`/`mini` and **scope** `full`/`docs` are declared at the top of `00-tracking.md`; read only through `ba-toolkit/scripts/profile.js`.
- **Gate severity** 🔴 stops everything · 🟡 stops its own scope · 🟠 time-boxed debt with a deadline · 🟢 never blocks.
- **`00-gaps.md`** merges per scope; only `ba-review all` overwrites it; every orchestrator ends with a review.
- **ADRs pass `check-adr.js`** (choice in the title, ≥2 options with a why-not, ≥1 negative consequence, NFR trace) and are immutable — supersede, never edit.
- **"Done" means verified**: a screen is done only when a **fresh `ac-verifier`** (never the agent that wrote the code) passes every `plan.md` **Proof** and every clause of each TC (`validate-done.js`, `accept.js`). Mutants must die (`mutate.js`); evidence must be newer than the code.
- **Optional pack skills may be absent**: the registry keys `skills.pro`/`skills.devonly` name skills that are not in this repo; core files must not hard-depend on them (check 44, `existsSync` guard), and `test.js --public` skips exactly the cases listed in `BỎ_QUA_CÔNG_KHAI`.

## The executable tooling

~88 zero-dependency Node scripts plus shared modules (`docpath.js`, `e2epath.js`, `profile.js`, `testcode.js`, `ledger.js`). Each script states its limits (`gioiHan`) and **counts, never judges** — judgment belongs to the skill and the human.

```bash
node .claude/skills/ba-toolkit/scripts/test.js --public # the toolkit's own suite — 201 checks (self-lint · scripts on example/ · ADVERSARIAL). Exit = failures.
node .claude/skills/ba-toolkit/scripts/lint.js          # structural/content-drift checks against the registry. Exit = error count.
node .claude/skills/ba-next/scripts/status.js example/docs   # where a project is in the pipeline, what next
node .claude/skills/ba-portal/scripts/build.js example/docs example/docs/Ho-so/portal.html   # offline docs portal
node .claude/skills/ba-export/scripts/install.js --to <dest> [--check] [--scope docs]       # install/update a consuming project
node .claude/skills/ba-export/scripts/report.js --plain # anonymous feedback, run in a consuming project
```

**The adversarial group of `test.js` is the point**: each checker gets a deliberately broken fixture and must report it — a checker that degrades to always-exit-0 keeps CI green while every gate trusting it goes blind. **Every new checker must stay silent on `example/docs`** (a warning there is a false positive until proven otherwise) **and** must catch its broken fixture.

## Automation

- **`PreToolUse` → `hook-guard.js`** blocks reading `.env`/keys/credentials — the only hard block.
- **`PostToolUse` → `hook-lint.js`**: records spec changes, checks table integrity and Mermaid, runs `lint.js` on toolkit edits. Exit 2 = advisory.
- **`Stop` → `hook-gate.js`**: reminds to update tracking, flags baseline edits without a change request, runs trace checks on touched screens.
- **CI**: `test.js --public`, `lint.js --strict`, then builds the example portal and renders it in headless Chrome (fails on any Mermaid error).
- Enforcement rule: **measurable rules → hooks and scripts; judgment → skills; call an existing checker, don't reimplement it.**

## Working in this repo

- Commit messages: conventional prefixes (`feat(ba-export): …`); Vietnamese without diacritics is the house style.
- Adding a convention = registry key + lint check + adversarial test + one line here + the why in `docs/decisions/README.md`. Retiring one is allowed.
- Feedback loop: consuming projects run `report.js`; a toolkit file that several projects had to edit means the default is wrong — fix the default.
