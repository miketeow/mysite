# Plan 011: Fix stale CLAUDE.md layout claim and merge the now-duplicate layouts

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat f2ff6f5..HEAD -- app/blog/\[slug\]/layout.tsx app/project/\[slug\]/layout.tsx CLAUDE.md`
> If any of these changed since this plan was written (including by plan 002,
> which also edits `CLAUDE.md` — run 002 first per `plans/README.md`), compare
> against the live code before proceeding; on an unexplained mismatch, treat
> it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plan 002 (same-file: both edit `CLAUDE.md` — run 002 first)
- **Category**: docs / tech-debt
- **Planned at**: commit `f2ff6f5`, 2026-07-16

## Why this matters

`CLAUDE.md`'s "Routing" section currently states that blog and project
detail pages use two different layout patterns: blog has "a 12-column grid
with a sticky `OnThisPage` aside," while project has "a minimal `main`
wrapper" with the aside "rendered inline" in the page component. That was
true at some point in this repo's history, but it isn't true now — a prior
commit already consolidated the two layouts to be structurally identical.
Leaving the doc as-is tells the next reader (human or agent) to expect a
difference that doesn't exist, wasting their time reconciling a non-issue.
Since the two `layout.tsx` files are now byte-for-byte identical except for
their exported function's name, this is also a good, low-risk opportunity to
collapse them into one shared layout component — removing the duplication
the stale doc was (correctly, historically) warning about, this time for
real.

## Current state

- `CLAUDE.md`'s "Routing" section, the layout-pattern bullet (locate via
  `grep -n "12-column grid\|minimal \`main\`" CLAUDE.md`):
  > "Each post type owns its own `layout.tsx`: blog has a 12-column grid
  > with a sticky `OnThisPage` aside...; project has a minimal `main`
  > wrapper and the page itself renders the aside inline...
  > (Two different patterns for the same need — worth noting but not
  > necessarily wrong.)"
- `app/blog/[slug]/layout.tsx` and `app/project/[slug]/layout.tsx` — confirm
  via `diff app/blog/\[slug\]/layout.tsx app/project/\[slug\]/layout.tsx`
  that the only difference is the exported function's name
  (`BlogPostLayout` vs. `ProjectPostLayout`); if the diff shows anything
  else, STOP (see below) — this plan's merge step assumes true structural
  identity.
- Neither `app/blog/[slug]/page.tsx` nor `app/project/[slug]/page.tsx`
  renders an `OnThisPage` aside inline in the page body anymore — both
  asides live in their respective `layout.tsx` files, applied identically.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Diff the two layouts | `diff app/blog/\[slug\]/layout.tsx app/project/\[slug\]/layout.tsx` | only the function name differs |
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Build | `npx next build` | succeeds, both routes render identically |

## Scope

**In scope** (the only files you should modify):
- `CLAUDE.md` (the layout-pattern bullet in "Routing")
- `app/blog/[slug]/layout.tsx`
- `app/project/[slug]/layout.tsx`
- One new shared file (see Step 2 for exact location/name)

**Out of scope**:
- `app/blog/[slug]/page.tsx`, `app/project/[slug]/page.tsx` — the page
  bodies are not part of this merge; only the `layout.tsx` wrapper files are
  affected.
- Any other `CLAUDE.md` section besides the one layout-pattern bullet.

## Git workflow

- Branch: `advisor/011-merge-duplicate-layouts`.
- Two commits is reasonable here: one for the CLAUDE.md doc fix (can land
  even if the merge step is deferred — see STOP conditions), one for the
  layout consolidation. A single commit is also fine if you prefer.
- Do NOT push or open a PR unless explicitly instructed.

## Steps

### Step 1: Confirm the layouts are truly identical, then fix the doc

```
diff "app/blog/[slug]/layout.tsx" "app/project/[slug]/layout.tsx"
```
Expected: the only diff line is the exported function name. If confirmed,
update the `CLAUDE.md` "Routing" bullet to state that both post types now
share the identical 12-column-grid + sticky-`OnThisPage`-aside layout
pattern (drop the "two different patterns... worth noting" framing
entirely, since it's no longer accurate), and drop the stale
`app/project/[slug]/page.tsx#L188` line-number citation.

**Verify**: `grep -n "12-column grid\|minimal \`main\`" CLAUDE.md` — the
"minimal main wrapper" phrasing should no longer appear.

### Step 2: Extract a shared layout component

Read both files fully first. Create `components/post-layout.tsx` (a Server
Component, matching the convention that server components are the default
per `CLAUDE.md`'s "Component organization" section) containing the shared
structure currently duplicated in both `layout.tsx` files — the container,
12-column grid, `<main>`/content column, and `<aside>` with the sticky
`OnThisPage`. Give it a generic exported name, e.g. `PostLayout`, accepting
whatever props the current layouts accept (likely just `children` — read
the current files to confirm the exact prop shape, including whether
`OnThisPage` needs any post-specific data passed in, before assuming
`children` is the only prop).

Then reduce both `app/blog/[slug]/layout.tsx` and
`app/project/[slug]/layout.tsx` to thin wrappers:
```tsx
import { PostLayout } from "@/components/post-layout";

export default function BlogPostLayout({ children }: { children: React.ReactNode }) {
  return <PostLayout>{children}</PostLayout>;
}
```
(and the equivalent `ProjectPostLayout` in the project file) — **or**, if
the two route segments have no reason to keep separate `layout.tsx` files at
all once the content is identical, consider whether Next.js's App Router
would allow removing one layout file and having both routes... no: `app/blog`
and `app/project` are separate route subtrees, so each needs its own
`layout.tsx` file to apply the layout to that segment — keep both files, just
make them both thin wrappers around the new shared component. Do not attempt
to merge the route segments themselves.

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 3: Build and visually confirm no regression

**Verify**: `npx next build` → succeeds. Via `npx next dev`, view one blog
post and one project page, confirm the grid layout and sticky
`OnThisPage` aside render identically to before this change on both.

## Test plan

No test suite exists in this repo. Verification is `tsc --noEmit`, a
successful build, and the manual visual check in Step 3 (this is a pure
extraction — output must be identical before and after).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx next build` exits 0
- [ ] `grep -n "minimal \`main\`" CLAUDE.md` returns no matches
- [ ] `diff "app/blog/[slug]/layout.tsx" "app/project/[slug]/layout.tsx"` shows both files are now thin wrappers around the same shared component (not necessarily identical to each other beyond that, since function names still legitimately differ)
- [ ] Visual check in Step 3 confirms no regression on either route
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row for 011 updated

## STOP conditions

Stop and report back (do not improvise) if:

- Step 1's diff shows more than just the function name differs — this means
  the layouts have drifted apart again since this plan was written; fix only
  the `CLAUDE.md` doc bullet (describe the *actual* current difference
  accurately) and skip the Step 2 merge, reporting why.
- The `OnThisPage` component (or anything else in the layout) turns out to
  need post-type-specific data (e.g. different heading-extraction logic for
  blog vs. project) that isn't obvious from a surface read — report this
  rather than forcing a shared component that papers over a real behavioral
  difference.

## Maintenance notes

- After this merge, any future change to the shared post-detail layout
  (grid columns, aside behavior, spacing) should be made once in
  `components/post-layout.tsx`, not duplicated across both `layout.tsx`
  files again.
- If blog and project pages ever need to genuinely diverge in layout, prefer
  a prop on `PostLayout` (e.g. `variant`) over re-forking the JSX into each
  route's `layout.tsx`.
