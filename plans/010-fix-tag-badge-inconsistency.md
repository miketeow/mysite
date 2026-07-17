# Plan 010: Fix tag badge variant inconsistency between blog and project pages

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat f2ff6f5..HEAD -- app/project/\[slug\]/page.tsx components/ui/badge.tsx`
> If either file changed since this plan was written (including by plan 009,
> which restructures the `MDXRemote` call in this same file but not the tag
> section — confirm the tag `Link`/`badgeVariants` block below still matches),
> compare against the live code before proceeding; on a mismatch, treat it
> as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plan 009 (same-file: both edit
  `app/project/[slug]/page.tsx` — run 009 first)
- **Category**: tech-debt
- **Planned at**: commit `f2ff6f5`, 2026-07-16

## Why this matters

The same UI concept — a clickable tag pill linking to `/tag/[tag]` — renders
with two visually different styles depending on whether you're on a blog
post or a project page. `app/blog/[slug]/page.tsx` uses
`badgeVariants({ variant: "tag" })` (a variant purpose-built for this exact
use case, per `CLAUDE.md`'s "Component organization" section: "A custom
`badge` variant `tag` is defined... and used for blog tag chips"), while
`app/project/[slug]/page.tsx` uses `badgeVariants({ variant: "secondary" })`
for the conceptually identical element. A visitor navigating between a blog
post and a project page would see the same kind of clickable tag pill change
appearance for no reason. Standardizing both on the purpose-built `tag`
variant fixes the inconsistency.

## Current state

- `components/ui/badge.tsx:21` — the `tag` variant exists specifically for
  this: (per `CLAUDE.md`, this is documented as "used for blog tag chips" —
  confirm the variant definition is still present at/near this line before
  proceeding, since this plan extends its use to project pages too).
- `app/blog/[slug]/page.tsx:92-107` (the live, already-correct pattern):
  ```tsx
  <div className="flex flex-wrap gap-2">
    {metadata.tags &&
      metadata.tags.map((tag: string) => (
        <Link
          href={`/tag/${tag}`}
          key={tag}
          className={badgeVariants({
            variant: "tag",
            className: "px-2 py-0.5 text-xs font-normal capitalize",
          })}
        >
          <Hash className="mr-1 size-3 opacity-50" />
          {tag}
        </Link>
      ))}
  </div>
  ```
- `app/project/[slug]/page.tsx:130-152` (the inconsistent one, to be fixed):
  ```tsx
  {metadata.tags && metadata.tags.length > 0 && (
    <div className="space-y-2">
      <h3 className="text-muted-foreground flex items-center gap-2 text-xs font-semibold tracking-wider uppercase">
        <Hash className="size-3" /> Topics
      </h3>
      <div className="flex flex-wrap gap-2">
        {metadata.tags.map((tag: string) => (
          <Link
            href={`/tag/${tag}`}
            key={tag}
            className={badgeVariants({
              variant: "secondary",
              className:
                "rounded-md px-2 py-0.5 text-xs font-normal capitalize",
            })}
          >
            <Hash className="mr-1 size-3 opacity-50" />
            {tag}
          </Link>
        ))}
      </div>
    </div>
  )}
  ```
  Note this block has additional structure (a "Topics" heading with an icon,
  part of a 3-column spec grid) that the blog version doesn't — only the
  `badgeVariants({ variant: ... })` call needs to change, not the
  surrounding layout.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Build | `npx next build` | succeeds |
| Visual check | `npx next dev` | tag pills look identical in style between a blog post and a project page |

## Scope

**In scope** (the only files you should modify):
- `app/project/[slug]/page.tsx` (the `variant: "secondary"` → `variant: "tag"` change only)

**Out of scope**:
- `app/blog/[slug]/page.tsx` — already correct, do not touch.
- `app/page.tsx:95` — the homepage's "latest blog posts" section also uses
  `badgeVariants({ variant: "secondary" })` for a single-tag chip preview,
  but that's a different, more compact context (inline with a date, no
  `Hash` icon, no link) — it wasn't flagged as part of this inconsistency
  and is out of scope; don't change it without separate justification.
- `components/ui/badge.tsx` — the variant definitions themselves; only the
  call site in `app/project/[slug]/page.tsx` needs to change.
- The surrounding "Topics" heading/icon/spacing structure in the project
  page's tag block — keep that exactly as-is, only the `badgeVariants` call
  changes.

## Git workflow

- Make edits directly in the working tree on the current branch. Do not
  create a new branch and do not commit.
- Do NOT push or open a PR unless explicitly instructed.

## Steps

### Step 1: Change the variant on the project page

In `app/project/[slug]/page.tsx`, change:
```tsx
className={badgeVariants({
  variant: "secondary",
  className:
    "rounded-md px-2 py-0.5 text-xs font-normal capitalize",
})}
```
to:
```tsx
className={badgeVariants({
  variant: "tag",
  className: "px-2 py-0.5 text-xs font-normal capitalize",
})}
```
(Drop `rounded-md` from the `className` override to match the blog page's
exact className string — check `components/ui/badge.tsx`'s `tag` variant
definition first: if `tag` already includes its own rounding via the
variant's base classes, an explicit `rounded-md` override would be
redundant; match whatever `app/blog/[slug]/page.tsx:98-101` does exactly,
since the goal is visual parity between the two pages.)

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 2: Visual comparison

Run `npx next dev`. Open one project page and one blog post (both with at
least one tag) side by side (or in sequence) and confirm the tag pills now
look identical in style (background, border, rounding, text weight) between
the two routes.

**Verify**: visual confirmation of parity.

### Step 3: Build

**Verify**: `npx next build` → succeeds.

## Test plan

No test suite exists in this repo. Verification is the visual comparison in
Step 2 plus a successful build.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx next build` exits 0
- [ ] `grep -n 'variant: "secondary"' app/project/\[slug\]/page.tsx` in the tags section specifically returns no matches (the tech-stack/timeline sections of that file may use other variants/styles unrelated to tags — don't worry about those)
- [ ] Visual check in Step 2 confirms tag pills match between blog and project pages
- [ ] No files outside `app/project/[slug]/page.tsx` are modified (`git status`)
- [ ] `plans/README.md` status row for 010 updated

## STOP conditions

Stop and report back if `components/ui/badge.tsx`'s `tag` variant no longer
exists at the location `CLAUDE.md` describes, or if applying it to the
project page's tag pills produces a visually broken result (e.g. colors that
clash badly with the surrounding "Topics" spec-grid column) that seems worse
than the current inconsistency — report rather than picking a third variant
unilaterally.

## Maintenance notes

- Any future new tag-chip rendering (e.g. on the `/tag/[tag]` index page or
  `/blog`/`/project` list pages, if not already using `tag`) should use this
  same `badgeVariants({ variant: "tag" })` pattern for consistency — check
  `app/tag/[tag]/page.tsx`, `app/blog/page.tsx`, `app/project/page.tsx` if
  extending this consistency pass further, though those are out of scope
  for this specific plan.
