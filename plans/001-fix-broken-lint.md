# Plan 001: Make `bun run lint` (and `npx eslint .`) exit 0 on a clean checkout

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat f2ff6f5..HEAD -- eslint.config.mjs package.json`
> If either file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `f2ff6f5`, 2026-07-16

## Why this matters

`package.json`'s `lint` script (`"lint": "eslint"`) currently exits non-zero on
a clean checkout — 24 parse errors, 43 warnings, all inside `content/**/*.mdx`
files. `eslint-plugin-mdx` is configured with `lintCodeBlocks: true`
(`eslint.config.mjs:56-73`), which tries to parse every fenced code block
inside blog/project MDX prose as real, compilable TypeScript/TSX. Those fences
are illustrative snippets (e.g. partial React components, truncated examples)
that were never meant to type-check standalone — parsing them as real source
is the wrong contract. Because there is no CI, this has been silently broken:
running `lint` gives 24 false-alarm errors that bury any real lint problem in
`app/`, `components/`, or `lib/`, and nobody notices because nothing enforces
it. Fixing this restores `lint` as a trustworthy signal.

## Current state

- `eslint.config.mjs:56-73` — the two MDX-related config blocks:
  ```js
  {
    ...mdx.flat,
    files: ["**/*.md", "**/*.mdx"],
    processor: mdx.createRemarkProcessor({
      lintCodeBlocks: true,
      languageMapper: {},
    }),
  },
  {
    ...mdx.flatCodeBlocks,
    files: ["**/*.md", "**/*.mdx"],
    rules: {
      ...mdx.flatCodeBlocks.rules,
      "no-console": "off",
      "no-undef": "error",
    },
  },
  ```
- `package.json:9` — `"lint": "eslint"` (no path argument, so it lints the
  whole repo including `content/`).
- Reproduction: running `npx eslint .` at the repo root currently prints
  `✖ 67 problems (24 errors, 43 warnings)`, with errors like
  `Parsing error: '>' expected` and `Parsing error: Unterminated regular
  expression literal` inside `content/projects/nextjs-auth-saas.mdx`,
  `content/projects/nextjs-crud.mdx`, and others — because those files'
  fenced code blocks are partial/illustrative TS/TSX that doesn't parse
  standalone.
- There is no `.eslintignore` and no `ignores` entry scoping MDX code-block
  linting out of `content/`.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Lint (repro) | `npx eslint .` | currently exits 1 with 24 errors |
| Lint (after fix) | `npx eslint .` (or `bun run lint`) | exit 0 |
| Typecheck | `npx tsc --noEmit` | exit 0, unaffected by this change |
| Build | `npx next build` | succeeds, unaffected by this change |

## Scope

**In scope** (the only files you should modify):
- `eslint.config.mjs`

**Out of scope** (do NOT touch, even though they look related):
- Any file under `content/**` — do not edit blog/project MDX prose or its
  code fences to make them "parse cleanly." The fences are intentionally
  illustrative; the lint config is what needs to change, not the content.
- `app/`, `components/`, `lib/` — the 43 warnings and remaining non-MDX
  lint output are out of scope for this plan; only the MDX code-block
  parsing errors are in scope.

## Git workflow

- Make edits directly in the working tree on the current branch. Do not
  create a new branch and do not commit.
- Do NOT push or open a PR unless explicitly instructed.

## Steps

### Step 1: Disable code-block linting for MDX content, or scope it safely

Two acceptable approaches — pick whichever is the smaller diff once you've
tried it:

**Option A (recommended, simplest): disable `lintCodeBlocks` for MDX.**
In `eslint.config.mjs`, change the first MDX block's processor config from
`lintCodeBlocks: true` to `lintCodeBlocks: false`. This stops ESLint from
attempting to parse fenced code inside `.md`/`.mdx` files as standalone
source, while still linting the MDX/JSX prose itself (unaffected — MDX
syntax errors in prose are still caught).

**Option B (if Option A produces an unacceptable loss of coverage): scope
`content/**` out of code-block linting only.**
Add a second `files`/`ignores` pair so the `mdx.flatCodeBlocks` rule block
applies everywhere `**/*.md`/`**/*.mdx` matches EXCEPT under `content/`:
```js
{
  ...mdx.flatCodeBlocks,
  files: ["**/*.md", "**/*.mdx"],
  ignores: ["content/**"],
  rules: {
    ...mdx.flatCodeBlocks.rules,
    "no-console": "off",
    "no-undef": "error",
  },
},
```
Try Option A first — it's simpler and there are currently no non-content
`.mdx`/`.md` files with fenced code blocks in this repo that would lose
coverage.

**Verify**: `npx eslint .` → exit code 0, zero parsing errors from
`content/**/*.mdx`.

### Step 2: Confirm no regression on the non-content lint surface

**Verify**: `npx eslint app components lib mdx-components.tsx *.mjs *.ts` →
same warning count as before this change (the fix should only remove the 24
content-fence parse errors, not silence anything in `app/`, `components/`,
or `lib/`).

## Test plan

No new automated tests — this is a lint-config change. Verification is the
`eslint` exit code and problem count itself.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npx eslint .` exits 0
- [ ] `npx tsc --noEmit` still exits 0 (unaffected, but confirm no regression)
- [ ] `git status` shows only `eslint.config.mjs` modified
- [ ] `plans/README.md` status row for 001 updated to DONE

## STOP conditions

Stop and report back (do not improvise) if:

- After Option A, `npx eslint .` still reports parsing errors from
  `content/**` — this means `lintCodeBlocks: false` didn't fully suppress
  code-block parsing and the MDX plugin's behavior differs from what's
  documented here; report the exact remaining error instead of trying
  increasingly exotic config workarounds.
- Fixing this reveals that `app/`, `components/`, or `lib/` also has real
  lint errors (not warnings) that were being masked by the noise — report
  them rather than silently fixing unrelated code (out of scope for this
  plan).

## Maintenance notes

- If this repo later adds real CI (see `plans/README.md`'s "considered and
  rejected" section), wire `bun run lint` into it now that it's a trustworthy
  gate.
- If someone wants MDX code-fence linting back in the future (e.g. to catch
  typos in complete, runnable snippets), it should be opt-in per file via a
  `languageMapper`/fence-language allowlist, not blanket-enabled across all
  content prose.
