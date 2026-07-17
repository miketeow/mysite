# Plan 002: Remove the dead legacy `rehype-pretty-code` rendering pipeline

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat f2ff6f5..HEAD -- app/blog/\[slug\]/page.tsx app/project/\[slug\]/page.tsx mdx-components.tsx lib/rehype-copy-plugin.ts components/copy-button.tsx app/globals.css package.json CLAUDE.md`
> If any of these changed since this plan was written, compare the "Current
> state" excerpts against the live code before proceeding; on a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `f2ff6f5`, 2026-07-16

## Why this matters

This site's code-block rendering was migrated from `rehype-pretty-code` +
`shiki` to a newer `@pierre/diffs`-backed pipeline (`lib/remark-pierre-code.ts`
+ `components/diff/*`), but the old pipeline's plumbing was never deleted.
Both content-detail pages (`app/blog/[slug]/page.tsx`,
`app/project/[slug]/page.tsx`) only register `rehypeSlug` and `rehypeMermaid`
as rehype plugins — `rehype-pretty-code` is not in either plugin list and has
zero live importers anywhere in the repo. Because of that, several things are
unreachable dead code that *look* live to anyone reading them: two branches in
`mdx-components.tsx` that key off attributes (`data-rehype-pretty-code-title`,
`data-rehype-pretty-code-figure`) that nothing produces anymore, the
`CopyButton` component and `rehypeExtractRawCode` plugin they depend on, and
~130 lines of CSS in `app/globals.css` styling `data-theme`/`data-line-numbers`/
`.diff.add`/`.diff.remove` markers that only `rehype-pretty-code` ever emitted.
`CLAUDE.md` also still describes this dead pipeline as if it were live. Left
in place, this dead code will mislead the next person (human or agent) who
touches code-block styling into editing a path that renders nothing, and
keeps three unused npm packages (`rehype-pretty-code`, `@shikijs/transformers`,
`shiki`) in `package.json`.

## Current state

- `app/blog/[slug]/page.tsx:113-122` and `app/project/[slug]/page.tsx:158-167`
  — both `MDXRemote` calls use:
  ```tsx
  options={{
    mdxOptions: {
      remarkPlugins: [remarkPierreCode],
      rehypePlugins: [rehypeSlug, rehypeMermaid],
    },
  }}
  ```
  Neither imports or registers `rehype-pretty-code`.
- `lib/remark-pierre-code.ts:66-118` (`remarkPierreCode`) — a **remark**
  plugin that runs before any rehype/hast stage. It visits every mdast `code`
  node except `lang === "mermaid"` and rewrites it into an MDX JSX element
  (`CodeFile`, `PatchDiff`, or `MultiFileDiff`), so no `<pre><code>` block
  for non-mermaid fences ever reaches the hast tree for a rehype plugin to
  process. Mermaid fences are left alone here and consumed later by
  `rehypeMermaid`, which replaces them with a pre-rendered SVG — they never
  reach the `code`/`pre`/`figure` MDX component overrides either.
- `mdx-components.tsx:14` — `import { CopyButton } from "./components/copy-button";`
  — only import site of `CopyButton`.
- `mdx-components.tsx:182-208` (`figcaption` override):
  ```tsx
  figcaption: ({ children, ...props }: ComponentProps<"figcaption">) => {
    // Guard: Only apply this style to rehype-pretty-code titles
    if ("data-rehype-pretty-code-title" in props) {
      return (
        <figcaption className={cn(/* ... */)} {...props}>
          {children}
        </figcaption>
      );
    }
    // Fallback for standard image captions
    return <figcaption {...props}>{children}</figcaption>;
  },
  ```
  The `if` branch is dead — nothing sets `data-rehype-pretty-code-title`
  anymore. The fallback (image captions) is live and must be kept.
- `mdx-components.tsx:210-231` (`figure` override):
  ```tsx
  figure: ({ children, ...props }: ComponentProps<"figure"> & { "data-raw"?: string }) => {
    // Check if this figure has the 'data-rehype-pretty-code-figure' attribute
    if ("data-rehype-pretty-code-figure" in props) {
      const rawCode = props["data-raw"] || "";
      return (
        <div className="group border-border relative my-6 overflow-hidden rounded-lg border">
          {children}
          <CopyButton text={rawCode} />
        </div>
      );
    }
    // Default behavior for other figures (images etc)
    return <figure {...props}>{children}</figure>;
  },
  ```
  The `if` branch is dead (same reason). The fallback (image figures) is
  live and must be kept.
- `lib/rehype-copy-plugin.ts` (21 lines, exports `rehypeExtractRawCode`) —
  zero importers anywhere in `app/`, `components/`, `lib/`,
  `mdx-components.tsx` (verified by repo-wide grep). Entirely dead file.
- `components/copy-button.tsx` (42 lines, exports `CopyButton`) — only
  referenced from the dead `figure` branch above. Entirely dead file. (Note:
  `components/diff/diff-copy-button.tsx` — a *different* component,
  `DiffCopyButton` — is the live copy-button used by the current pipeline via
  `components/diff/file.tsx`, `patch-diff.tsx`, `multi-file-diff.tsx`. Do not
  confuse the two or touch `diff-copy-button.tsx`.)
- `app/globals.css:207-339` — dead CSS block (full text, for reference):
  lines 207-259 style `pre[data-theme*=" "]`, `code[data-theme*=" "]`,
  `code[data-line-numbers]` and its `::before` counters/highlight —
  attributes only `rehype-pretty-code` (optionally with a line-numbers
  transformer) ever sets. Lines 260-312 style `.diff.add`/`.diff.remove`
  markers — a class-based diff-highlighting convention `rehype-pretty-code`
  transformers use, not what `@pierre/diffs` renders (it uses its own
  shadow-DOM-based diff rendering, confirmed via `components/diff/code-patch.tsx`
  and `code-multi.tsx`'s `unsafeCSS`/`HIDE_STATS` handling, which targets
  `[data-deletions-count]`/`[data-additions-count]`, not `.diff.add`/`.diff.remove`).
  Lines 313-331 are the dark-mode overrides for the same dead selectors.
  Lines 333-339:
  ```css
  /* Connect the code block to the tab header */
  [role="tabpanel"] > div.group.border-border.relative.my-6 {
    margin-top: 0 !important;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    border-top: none;
  }
  ```
  targets the exact class combination (`group border-border relative my-6`)
  used only by the dead `figure` branch's wrapper `<div>` above — also dead.
  **Before deleting this block**, re-run the grep in Step 4 to confirm no
  live component in `components/diff/*` or elsewhere produces an element
  matching `data-theme`, `data-line-numbers`, `.diff.add`/`.diff.remove`, or
  the exact class string `group border-border relative my-6` — the repo may
  have changed since this plan was written.
- `package.json:22,37,39` — `@shikijs/transformers`, `rehype-pretty-code`,
  `shiki` listed as direct `dependencies`. None are imported anywhere in
  `app/`, `components/`, `lib/`, `mdx-components.tsx` (verified by grep).
  `@pierre/diffs` (already a dependency, `package.json:15`) pulls its own
  `shiki`/`@shikijs/transformers` transitively — these three direct
  dependencies are pure duplication.
- `CLAUDE.md:15` (Content & MDX bullet) states the rehype pipeline is
  `rehype-slug → rehypeExtractRawCode → (blog only) rehypeMermaid →
  rehype-pretty-code`, plus `transformerNotationDiff` on project pages — none
  of that matches current code.
- `CLAUDE.md:92` (`lib/rehype-mermaid.ts` bullet) states mermaid is "Currently
  applied only on the blog route, not on project pages" — both pages actually
  register `rehypeMermaid` identically now.
- `CLAUDE.md:91` documents `lib/rehype-copy-plugin.ts` as feeding the (now
  dead) `CopyButton`/`figure` pattern.
- `CLAUDE.md:81-96` ("Helper Utilities") never mentions
  `lib/remark-pierre-code.ts`, `lib/diffs-theme.ts`, or any of the 9 files in
  `components/diff/` — the actual live code-rendering subsystem.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Verify no importers before deleting a file | `grep -rn "<symbol or path>" app components lib mdx-components.tsx` | zero matches |
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Lint | `npx eslint app components lib mdx-components.tsx` | no new errors |
| Build | `npx next build` | succeeds, all blog/project pages render |

## Scope

**In scope** (the only files you should modify):
- `mdx-components.tsx` (remove dead import + dead branches only)
- `lib/rehype-copy-plugin.ts` (delete file)
- `components/copy-button.tsx` (delete file)
- `app/globals.css` (remove the dead CSS block, lines ~207-339)
- `package.json` (remove 3 dependency entries)
- `CLAUDE.md` (rewrite the "Content & MDX" bullet, the mermaid-scope note,
  the `lib/rehype-copy-plugin.ts` bullet, and add coverage of
  `lib/remark-pierre-code.ts` / `lib/diffs-theme.ts` / `components/diff/*`
  to "Helper Utilities")

**Out of scope** (do NOT touch, even though they look related):
- `components/diff/*` — this is the live pipeline; do not modify it.
- `components/diff/diff-copy-button.tsx` (`DiffCopyButton`) — a different,
  live component from the dead `CopyButton`. Do not delete or rename.
- `components/code-group.tsx` (`CodeGroup`) — unused by current content but
  not unreachable dead code (it's a generic tab-wrapper any future content
  could still use). Leave it alone.
- `lib/remark-pierre-code.ts`, `lib/rehype-mermaid.ts`, `lib/diffs-theme.ts`
  — the live pipeline files; read-only reference for the CLAUDE.md rewrite,
  do not modify their code.
- `mdx-components.tsx`'s `code` override's `isBlock` check
  (`"data-theme" in props || "data-language" in props`) — also technically
  unreachable now (no code block ever reaches it with those attributes since
  `remarkPierreCode` intercepts fences before rehype), but touching it has no
  behavioral or CSS-removal benefit and adds removal risk for no gain. Leave
  it as-is.
- Any file under `content/**`.

## Git workflow

- Make edits directly in the working tree on the current branch. Do not
  create a new branch and do not commit.
- Do NOT push or open a PR unless explicitly instructed.

## Steps

### Step 1: Remove the dead branches in `mdx-components.tsx`

1. Remove the `CopyButton` import at line 14.
2. In the `figcaption` override, delete the `if ("data-rehype-pretty-code-title" in props) { ... }` block, keeping only the fallback `return <figcaption {...props}>{children}</figcaption>;` (adjust the function body so it always returns the fallback — the whole `figcaption` entry can now be a one-line passthrough, or keep it as an explicit function if you prefer symmetry with `blockquote`; either is fine).
3. In the `figure` override, delete the `if ("data-rehype-pretty-code-figure" in props) { ... }` block (including the now-unused `"data-raw"?: string` type addition on the props type if nothing else needs it — check first), keeping only `return <figure {...props}>{children}</figure>;`.

**Verify**: `grep -n "CopyButton\|data-rehype-pretty-code" mdx-components.tsx` → no matches.

### Step 2: Delete the two dead files

```
rm lib/rehype-copy-plugin.ts
rm components/copy-button.tsx
```

**Verify**: `grep -rn "rehype-copy-plugin\|copy-button" app components lib mdx-components.tsx --include="*.ts" --include="*.tsx"` → no matches (aside from `diff-copy-button.tsx`, which is a different, unrelated file — confirm the grep result isn't matching that path before treating it as a false positive).

### Step 3: Typecheck after the TS/TSX removal

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 4: Confirm the CSS block is truly dead, then remove it

Before deleting, run:
```
grep -rn "data-theme\|data-line-numbers\|\.diff\.add\|\.diff\.remove\|group border-border relative my-6" app components lib mdx-components.tsx --include="*.ts" --include="*.tsx"
```
Expected: zero matches (the `isBlock` check in `mdx-components.tsx`'s `code`
override references `"data-theme" in props` as a *string literal property
check*, not a CSS selector — if your grep flags that line, it's expected and
not a reason to keep the CSS; the CSS selectors themselves have no producer).

If the grep is clean, delete `app/globals.css` lines 207-339 (the entire
block from the `/* --- Syntax Highlighting & Line Numbers --- */` comment
through the `[role="tabpanel"] > div.group.border-border.relative.my-6`
rule, inclusive). Leave the `@layer utilities { .custom-scrollbar... }`
block immediately after (currently starting at line 341) untouched.

**Verify**: `npx next build` → succeeds; visually or via diff, confirm no
page currently renders `data-theme`/`data-line-numbers`/`.diff.add`/
`.diff.remove` markup (it shouldn't, per Step 4's grep).

### Step 5: Remove the three unused dependencies

In `package.json`, delete these three lines from `dependencies`:
```
"@shikijs/transformers": "^3.23.0",
"rehype-pretty-code": "^0.14.3",
"shiki": "^3.23.0",
```
Then reinstall to update the lockfile: `bun install`.

**Verify**: `grep -n "shiki\|rehype-pretty-code" package.json` → no matches
outside of `@pierre/diffs`'s own transitive tree (which won't appear in this
repo's `package.json` at all — only check the top-level file). `bun.lock`
diff shows only removals, no unrelated version bumps.

### Step 6: Update `CLAUDE.md` to describe the actual pipeline

Replace `CLAUDE.md:15`'s pipeline description with the accurate one:
`remarkPierreCode` (remark, rewrites fenced code into `CodeFile`/`PatchDiff`/
`MultiFileDiff` JSX) → `rehypeSlug` → `rehypeMermaid` (rehype, both routes,
identical on blog and project pages).

Update `CLAUDE.md:92`'s mermaid bullet to remove the "blog only" claim —
`rehypeMermaid` now runs identically on both `app/blog/[slug]/page.tsx` and
`app/project/[slug]/page.tsx`.

Remove or rewrite the `lib/rehype-copy-plugin.ts` bullet (the file no longer
exists after Step 2).

Add a new "Helper Utilities" bullet (or short subsection) covering:
- `lib/remark-pierre-code.ts` — the remark plugin that routes fenced code
  into `CodeFile` (plain/tabbed code), `PatchDiff` (` ```diff `/` ```patch `
  fences), or `MultiFileDiff` (` ```multidiff ` fences, split on a `===`+
  separator line), based on fence language.
- `lib/diffs-theme.ts` — theme wiring for `@pierre/diffs`.
- `components/diff/*` — the 9 components rendering the above (`CodeFile`,
  `CodeTabs`/`CodeTabsClient`, `PatchDiff`, `MultiFileDiff`, plus the shared
  `File`/`DiffCopyButton` primitives).

**Verify**: Read the updated `CLAUDE.md` "Content & MDX" and "Helper
Utilities" sections back and confirm every file path/symbol you cited
actually exists at that path (`ls lib/remark-pierre-code.ts lib/diffs-theme.ts
components/diff/`).

## Test plan

No new automated tests (no test suite exists in this repo — see
`plans/README.md`'s "considered and rejected" section). Verification is
`tsc --noEmit`, `eslint`, and `next build` all succeeding, plus a manual
visual check (or `next build`'s static HTML output diff) that at least one
blog post and one project page with code fences still render identically
before/after.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx eslint app components lib mdx-components.tsx` reports no new errors
- [ ] `npx next build` exits 0
- [ ] `grep -rn "rehype-pretty-code\|CopyButton\|data-rehype-pretty-code" app components lib mdx-components.tsx package.json` returns no matches
- [ ] `ls lib/rehype-copy-plugin.ts components/copy-button.tsx` reports both as not found
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row for 002 updated

## STOP conditions

Stop and report back (do not improvise) if:

- The Step 4 grep finds a live producer of `data-theme`, `data-line-numbers`,
  `.diff.add`/`.diff.remove`, or the exact class string
  `group border-border relative my-6` — this means the codebase has drifted
  from what this plan describes; do not delete the CSS block, report what
  you found instead.
- `next build` fails after any step — revert that step's change and report
  the exact build error rather than trying further edits to "fix" it.
- You find a content `.mdx` file that appears to rely on
  `data-rehype-pretty-code-*` attributes surviving into rendered output
  (it shouldn't, per `remarkPierreCode`'s unconditional interception, but if
  you find evidence otherwise, stop).

## Maintenance notes

- After this lands, the only code-rendering path in the repo is
  `remarkPierreCode` → `components/diff/*` (`@pierre/diffs`). Any future
  syntax-highlighting or diff-styling work should go there, not in
  `app/globals.css`'s syntax-highlighting section (which will no longer
  exist) or `mdx-components.tsx`'s `figure`/`figcaption` overrides.
- `components/code-group.tsx` (`CodeGroup`) remains available but unused —
  if it's later adopted by content, verify it still composes correctly with
  `remarkPierreCode`'s output (its children are expected to be already-
  transformed `CodeFile`-shaped JSX, same as `CodeTabs` in
  `components/diff/code-tabs.tsx`).
