# Plan 009: Extract shared `MDXRemote` options for blog/project pages

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat f2ff6f5..HEAD -- app/blog/\[slug\]/page.tsx app/project/\[slug\]/page.tsx`
> If either file changed since this plan was written (including by plan 002,
> which touches `mdx-components.tsx` but not these files' plugin arrays —
> confirm the `remarkPlugins`/`rehypePlugins` arrays still match below),
> compare against the live code before proceeding; on a mismatch, treat it
> as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (logical) — but see `plans/README.md`: plan 010 edits
  the same two files after this one, run 009 first.
- **Category**: tech-debt
- **Planned at**: commit `f2ff6f5`, 2026-07-16

## Why this matters

`app/blog/[slug]/page.tsx` and `app/project/[slug]/page.tsx` both construct
an identical `MDXRemote` call — same `components={getMDXComponents()}`, same
`remarkPlugins: [remarkPierreCode]`, same `rehypePlugins: [rehypeSlug,
rehypeMermaid]`. Every future change to the MDX pipeline (e.g. adding a new
rehype plugin, changing plugin order) requires touching both files in
lockstep — and per the audit that produced this plan, the two pages have
already drifted from each other at least once in this repo's history before
being reconciled. Extracting one shared helper removes that duplication tax
entirely: change the pipeline once, both routes pick it up.

## Current state

- `app/blog/[slug]/page.tsx:113-122`:
  ```tsx
  <MDXRemote
    source={content}
    components={getMDXComponents()}
    options={{
      mdxOptions: {
        remarkPlugins: [remarkPierreCode],
        rehypePlugins: [rehypeSlug, rehypeMermaid],
      },
    }}
  />
  ```
- `app/project/[slug]/page.tsx:158-167` — byte-for-byte the same
  `MDXRemote` props shape.
- Both files import `rehypeSlug` from `"rehype-slug"`, `rehypeMermaid` from
  `"@/lib/rehype-mermaid"`, `remarkPierreCode` from
  `"@/lib/remark-pierre-code"`, and `getMDXComponents` from
  `"@/mdx-components"` independently at their top.
- `lib/mdx.ts` is this repo's existing convention for shared,
  content-pipeline-adjacent helper logic (per `CLAUDE.md`'s "Helper
  Utilities" section) — a new small helper here fits that existing pattern
  rather than introducing a new convention.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Build | `npx next build` | succeeds, both routes render identically |

## Scope

**In scope** (the only files you should modify):
- One new file: `lib/mdx-options.ts` (or add to an existing small lib file —
  see Step 1 for the exact choice)
- `app/blog/[slug]/page.tsx`
- `app/project/[slug]/page.tsx`

**Out of scope**:
- `mdx-components.tsx`, `lib/remark-pierre-code.ts`, `lib/rehype-mermaid.ts`
  — no changes to the plugins themselves, only to where their composition
  into an options object lives.
- Do not change the actual plugin list, order, or `getMDXComponents()`
  call — this is a pure extraction; behavior must be identical before and
  after.

## Git workflow

- Branch: `advisor/009-extract-shared-mdx-options`.
- Single commit, message style matches `git log` (e.g.
  `extract shared MDXRemote options for blog/project pages`).
- Do NOT push or open a PR unless explicitly instructed.

## Steps

### Step 1: Create the shared helper

Create `lib/mdx-options.ts`:
```ts
import rehypeSlug from "rehype-slug";

import { rehypeMermaid } from "@/lib/rehype-mermaid";
import { remarkPierreCode } from "@/lib/remark-pierre-code";
import { getMDXComponents } from "@/mdx-components";

// Shared MDXRemote configuration for both blog and project detail pages —
// keep the two routes' rendering pipeline identical by construction.
export function getMdxRenderOptions() {
  return {
    components: getMDXComponents(),
    options: {
      mdxOptions: {
        remarkPlugins: [remarkPierreCode],
        rehypePlugins: [rehypeSlug, rehypeMermaid],
      },
    },
  };
}
```
(Match this repo's import-ordering convention — `@trivago/prettier-plugin-sort-imports`
groups `react`/`next` → third-party → `@/…` → relative, each group blank-line
separated; run `npx prettier --write lib/mdx-options.ts` after creating it
if you're not confident about matching the ordering by hand.)

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 2: Use the helper in `app/blog/[slug]/page.tsx`

Replace the direct imports of `rehypeSlug`, `rehypeMermaid`,
`remarkPierreCode`, `getMDXComponents` (if now unused elsewhere in the file
— check first, since `getMDXComponents` might not be used elsewhere) with a
single import of `getMdxRenderOptions` from `@/lib/mdx-options`. Replace the
`MDXRemote` call:
```tsx
<MDXRemote source={content} {...getMdxRenderOptions()} />
```

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 3: Use the helper in `app/project/[slug]/page.tsx`

Same change, mirrored.

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 4: Lint and build

**Verify**: `npx eslint app/blog/[slug]/page.tsx app/project/[slug]/page.tsx lib/mdx-options.ts` →
no new errors (unused-import warnings would indicate a leftover import you
forgot to remove in Step 2/3). `npx next build` → succeeds.

### Step 5: Confirm rendering is unchanged

View one existing blog post and one existing project (with code fences, if
any exist in current content — check `content/blog`/`content/projects` for
one with a fenced code block) via `next dev` and confirm identical rendering
to before this change (headings get slugged IDs, code fences still render
via `CodeFile`/etc., mermaid fences if any still render as SVG).

**Verify**: visual confirmation, no console errors.

## Test plan

No test suite exists in this repo. Verification is `tsc --noEmit`, `eslint`,
`next build`, and the manual rendering check in Step 5 (this is a pure
extraction — output must be byte-identical).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx eslint app/blog/[slug]/page.tsx app/project/[slug]/page.tsx lib/mdx-options.ts` reports no new errors
- [ ] `npx next build` exits 0
- [ ] `grep -n "remarkPierreCode\|rehypeMermaid\|rehypeSlug" app/blog/\[slug\]/page.tsx app/project/\[slug\]/page.tsx` returns no matches (imports now live only in `lib/mdx-options.ts`)
- [ ] Manual rendering check in Step 5 shows no regression
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row for 009 updated

## STOP conditions

Stop and report back if either page.tsx file's current `MDXRemote` props
don't match the "Current state" excerpt exactly (e.g. if plan 002 or another
change altered the plugin list) — reconcile the helper against the live
plugin list rather than the one documented here before proceeding.

## Maintenance notes

- Any future change to the MDX rendering pipeline (new rehype/remark plugin,
  different plugin order) should now be made once in
  `lib/mdx-options.ts:getMdxRenderOptions`, not duplicated across both page
  files.
- If the two routes ever need to genuinely diverge in their MDX options
  (e.g. one route wants an extra plugin the other doesn't), that's a sign
  this helper should take a parameter or the divergent route should opt out
  explicitly — don't silently fork the logic back into each page file.
