# Plan 005: Parallelize homepage data fetching with `Promise.all`

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat f2ff6f5..HEAD -- app/page.tsx`
> If this file changed since this plan was written, compare the "Current
> state" excerpt against the live code before proceeding; on a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `f2ff6f5`, 2026-07-16

## Why this matters

`app/page.tsx` (the homepage) awaits `getBlogPosts()` and `getProjects()`
sequentially — the second call doesn't start until the first resolves, even
though they're independent, unrelated filesystem reads. `components/header.tsx`
fetches the exact same pair of functions and already does it correctly with
`Promise.all`. This is a small, easily-fixed, and inconsistent-with-the-rest-
of-the-repo pattern — worth fixing both for the (small) latency win and for
matching the convention already established elsewhere in the codebase.

## Current state

- `app/page.tsx:11-13`:
  ```tsx
  export default async function Home() {
    const latestBlogPosts = (await getBlogPosts()).slice(0, 4);
    const featuredProjects = (await getProjects()).slice(0, 2);
    return (
  ```
- `components/header.tsx:12-15` — the existing correct pattern to match:
  ```tsx
  const [blogPosts, projects] = await Promise.all([
    getBlogPosts(),
    getProjects(),
  ]);
  ```
- Both `getBlogPosts` and `getProjects` (`lib/mdx.ts:46-89`) are `cache()`-
  wrapped and have no ordering dependency on each other.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Build | `npx next build` | succeeds, homepage renders identically |

## Scope

**In scope** (the only files you should modify):
- `app/page.tsx`

**Out of scope**:
- `components/header.tsx` — already correct, reference only.
- `lib/mdx.ts` — no changes needed.

## Git workflow

- Make edits directly in the working tree on the current branch. Do not
  create a new branch and do not commit.
- Do NOT push or open a PR unless explicitly instructed.

## Steps

### Step 1: Replace the sequential awaits with `Promise.all`

```tsx
export default async function Home() {
  const [blogPosts, projects] = await Promise.all([
    getBlogPosts(),
    getProjects(),
  ]);
  const latestBlogPosts = blogPosts.slice(0, 4);
  const featuredProjects = projects.slice(0, 2);
  return (
```

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 2: Confirm homepage output is unchanged

**Verify**: `npx next build` → succeeds; spot-check (via `next dev` or the
build output) that the homepage still shows the same 4 latest blog posts and
2 featured projects, in the same order, as before this change.

## Test plan

No test suite exists in this repo. Verification is the build succeeding and
a manual/visual confirmation that homepage content is unchanged (this is a
pure refactor — output must be identical, only the fetch timing changes).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx next build` exits 0
- [ ] `grep -n "Promise.all" app/page.tsx` shows one match
- [ ] Homepage renders the same content as before (manual check)
- [ ] No files outside `app/page.tsx` are modified (`git status`)
- [ ] `plans/README.md` status row for 005 updated

## STOP conditions

Stop and report back if `next build` fails after this change, or if the
homepage's rendered content (posts/projects shown, their order) differs from
before — this would indicate `latestBlogPosts`/`featuredProjects` were
renamed or restructured incorrectly during the edit.

## Maintenance notes

- None — this is a self-contained, low-risk refactor with no downstream
  interactions.
