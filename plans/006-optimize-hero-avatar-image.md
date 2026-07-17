# Plan 006: Render the hero avatar through `next/image`

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat f2ff6f5..HEAD -- components/hero.tsx components/ui/avatar.tsx`
> If either file changed since this plan was written, compare the "Current
> state" excerpts against the live code before proceeding; on a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `f2ff6f5`, 2026-07-16

## Why this matters

`components/hero.tsx` renders the homepage's profile photo through Radix's
`Avatar`/`AvatarImage` (`components/ui/avatar.tsx`), which wraps
`@radix-ui/react-avatar`'s `Image` primitive — a plain `<img>` with no
`width`/`height`, no `next/image` optimization (no responsive `srcset`, no
AVIF/WebP negotiation), and a real layout-shift risk since no intrinsic
dimensions are declared. This image is above the fold on the homepage — the
first thing a visitor (including a hiring manager clicking through from a
resume) sees — and is exactly the kind of low-effort, high-visibility win
Next.js's own `next/image` conventions exist for. No other `next/image`
usage exists anywhere in `app/`, `components/`, or `lib/` currently, so this
is also the first precedent for the pattern in this repo.

## Current state

- `components/hero.tsx:52-57`:
  ```tsx
  <div className="relative">
    <Avatar className="size-16">
      <AvatarImage src="/images/proflie.jpg" alt="profile" />
      <AvatarFallback>MT</AvatarFallback>
    </Avatar>
  </div>
  ```
  Note the filename typo `proflie.jpg` (not `profile.jpg`) — this is the
  actual, current filename on disk; do not "fix" the typo by renaming the
  file unless you also update this reference, and only if explicitly asked
  to (out of scope for this plan — see Scope below).
- `components/ui/avatar.tsx:1-35` (shadcn-generated primitive):
  ```tsx
  import * as AvatarPrimitive from "@radix-ui/react-avatar";
  // ...
  function AvatarImage({
    className,
    ...props
  }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
    return (
      <AvatarPrimitive.Image
        data-slot="avatar-image"
        className={cn("aspect-square size-full", className)}
        {...props}
      />
    );
  }
  ```
  `AvatarPrimitive.Image` renders a bare `<img>` under the hood — it does not
  support swapping in `next/image` via a prop; it takes standard `<img>`
  props.
- `size-16` (Tailwind) means the rendered avatar is a fixed 64×64px box
  regardless of the source image's dimensions.
- No file in `app/`, `components/`, or `lib/` imports `next/image` (verified
  by repo-wide grep) — there is no existing pattern in this repo to copy from
  for this specific case.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Build | `npx next build` | succeeds |
| Visual check | `npx next dev` | avatar renders correctly, no CLS |

## Scope

**In scope** (the only files you should modify):
- `components/hero.tsx`

**Out of scope** (do NOT touch, even though they look related):
- `components/ui/avatar.tsx` — this is a shadcn-generated primitive; per
  this repo's convention (documented in `CLAUDE.md`'s "Component
  organization" section), primitives in `components/ui/` stay untouched.
  Solve this at the call site in `hero.tsx` instead, not by modifying the
  primitive.
- `public/images/proflie.jpg` — do not rename this file or "fix" the typo;
  that's a separate, unrelated decision the site owner should make
  explicitly, not a side effect of a perf fix.
- Any other `Avatar`/`AvatarImage` usage elsewhere in the repo (check
  `grep -rn "AvatarImage" app components` first — if there turns out to be
  more than one call site, only fix `components/hero.tsx`'s; report the
  others rather than fixing them, since this plan was scoped against a
  single known call site).

## Git workflow

- Make edits directly in the working tree on the current branch. Do not
  create a new branch and do not commit.
- Do NOT push or open a PR unless explicitly instructed.

## Steps

### Step 1: Confirm this is the only `AvatarImage` call site

```
grep -rn "AvatarImage" app components
```
Expected: exactly one match, `components/hero.tsx`. If there are others,
stop and report (see STOP conditions) rather than fixing all of them — this
plan's evidence and testing only covers the hero usage.

### Step 2: Replace the `Avatar`/`AvatarImage` composition with a `next/image`-backed version

Radix's `Avatar.Image` accepts an `asChild` pattern in newer versions, but
the simplest, lowest-risk approach that keeps the existing fallback behavior
(the `MT` initials shown while the image loads/if it fails) is to keep using
`Avatar`/`AvatarFallback` for the container/fallback, but render the image
itself with `next/image` directly instead of through `AvatarImage`,
absolutely positioned to fill the same box:

```tsx
import Image from "next/image";
// ...
<div className="relative">
  <Avatar className="size-16">
    <AvatarFallback>MT</AvatarFallback>
  </Avatar>
  <Image
    src="/images/proflie.jpg"
    alt="profile"
    width={64}
    height={64}
    priority
    className="absolute inset-0 size-16 rounded-full object-cover"
  />
</div>
```

Notes:
- `width={64}`/`height={64}` match the existing `size-16` (Tailwind's
  `size-16` = 4rem = 64px at the default root font size) — confirm this
  against `app/globals.css`'s `@theme` block if the root font size has been
  customized; if it hasn't (check first), 64 is correct.
- `priority` is appropriate here since this is an above-the-fold homepage
  image — it tells Next.js to preload it rather than lazy-load.
- `rounded-full object-cover` replicates `Avatar`'s circular clipping
  (`components/ui/avatar.tsx`'s `Avatar` wrapper applies `rounded-full
  overflow-hidden` — confirm this class is actually present on the `Avatar`
  root before assuming `Image` needs its own `rounded-full`; if `Avatar`'s
  overflow-hidden circle already clips a child positioned absolutely inside
  it, you may not need `rounded-full` on the `Image` itself — verify visually
  in Step 3 either way).
- If `AvatarFallback`'s initials become permanently visible behind/around
  the now-separately-rendered image (a z-index/layering issue), add
  `className="relative z-10"` (or similar) to the `Image` so it visually
  sits above the fallback.

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 3: Visual check

Run `npx next dev`, view the homepage, confirm:
- The avatar renders at the same visual size/position as before this change
  (64×64px circle, same spot next to the name/bio).
- No visible layout shift as the image loads.
- The `MT` fallback is not visible once the real image has loaded (no
  double-rendering/flash).

**Verify**: visual confirmation per above; take a screenshot if useful for
your own comparison, but this is not required as a committed artifact.

### Step 4: Full build

**Verify**: `npx next build` → succeeds, homepage builds without errors or
image-optimization warnings.

## Test plan

No test suite exists in this repo. Verification is the visual check in Step
3 plus a successful build.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx next build` exits 0
- [ ] `grep -n "next/image" components/hero.tsx` shows an import
- [ ] Visual check in Step 3 confirms no regression (same size/position, no
      CLS, no fallback-flash)
- [ ] No files outside `components/hero.tsx` are modified (`git status`)
- [ ] `plans/README.md` status row for 006 updated

## STOP conditions

Stop and report back (do not improvise) if:

- Step 1's grep finds more than one `AvatarImage` call site — report the
  additional locations; do not extend this plan's fix to them without
  separate scoping.
- The visual check in Step 3 shows the image doesn't clip to a circle, is
  misaligned, or the fallback initials remain visible/flash — try one
  reasonable CSS adjustment (per the notes in Step 2), but if it's still
  visually broken after that, stop and report rather than iterating
  extensively on layout CSS.

## Maintenance notes

- This is the first `next/image` usage in the repo — if other images are
  added to the site later (e.g. blog post images, project screenshots),
  this call site is the reference pattern to follow.
- If Radix's `Avatar` primitive is ever upgraded to natively support
  `asChild` composition with `next/image` cleanly, this workaround could be
  simplified — not required now, just a note for future maintenance.
