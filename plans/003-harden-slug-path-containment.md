# Plan 003: Harden slug-to-filepath construction against path traversal

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat f2ff6f5..HEAD -- lib/mdx.ts`
> If this file changed since this plan was written, compare the "Current
> state" excerpt against the live code before proceeding; on a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `f2ff6f5`, 2026-07-16

## Why this matters

`getBlogPostBySlug` and `getProjectBySlug` in `lib/mdx.ts` build a filesystem
path directly from the route's `slug` param via `path.join(...)` and read it
with `fs.readFileSync`, with only an `fs.existsSync` existence check — no
containment check that the resolved path actually stays inside the intended
`content/blog`/`content/projects` directory, and no character allowlist on
the slug itself. `path.join` normalizes `..` segments, so a slug value
containing relative traversal (e.g. `../../some-file`) resolves outside the
content directory. Neither `app/blog/[slug]/page.tsx` nor
`app/project/[slug]/page.tsx` sets `export const dynamicParams = false`, and
`next.config.ts` doesn't set `output: "export"` — so on `next start` (a real
Node server; see `package.json:8`), a request for a slug outside the
build-time `generateStaticParams()` list still invokes these functions at
request time with an attacker-controlled string. The blast radius is bounded
(the constructed path always ends in a literal `.mdx` suffix, so only files
whose full path happens to end that way could be disclosed), but there's no
reason to leave the gap open — the fix is a few lines and removes any doubt.

## Current state

- `lib/mdx.ts:34` — `const CONTENT_DIR = path.join(process.cwd(), "content");`
- `lib/mdx.ts:128-137`:
  ```ts
  export const getBlogPostBySlug = cache(async (slug: string) => {
    const filePath = path.join(CONTENT_DIR, "blog", `${slug}.mdx`);
    if (!fs.existsSync(filePath)) return null;

    const { data, content } = readMDXFile(filePath);
    return {
      metadata: BlogMetadataSchema.parse(data), // Runtime validation
      content,
    };
  });
  ```
- `lib/mdx.ts:139-148` — `getProjectBySlug` is the same pattern against
  `content/projects`.
- `lib/mdx.ts:41-44` — `readMDXFile` (the shared, `cache()`-wrapped file
  reader both functions call) does no path validation of its own; it trusts
  its caller.
- Both callers pass the route's raw dynamic segment straight through:
  `app/blog/[slug]/page.tsx:32-33` (`generateMetadata`) and `:46-47` (the
  page body) both do `const { slug } = await params; const post = await
  getBlogPostBySlug(slug);` with no validation in between. Same pattern in
  `app/project/[slug]/page.tsx:33-34,47-48`.
- `getMDXFiles` (`lib/mdx.ts:36-38`) — the function that enumerates real
  filenames for `generateStaticParams` — only ever returns filenames with a
  `.mdx` extension already present in `content/blog`/`content/projects`, so
  every *legitimate* slug this repo produces is already safe; the gap only
  matters for request-time lookups of slugs Next.js didn't statically
  generate.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Build | `npx next build` | succeeds, all existing blog/project slugs still resolve |
| Dev server manual check | `npx next dev` | see Step 3 |

## Scope

**In scope** (the only files you should modify):
- `lib/mdx.ts`

**Out of scope** (do NOT touch, even though they look related):
- `app/blog/[slug]/page.tsx`, `app/project/[slug]/page.tsx` — no changes
  needed there; the fix belongs entirely in `lib/mdx.ts` so both callers
  benefit automatically.
- `getBlogPosts`/`getProjects`/`getAllTags`/`getPostsByTag` — these already
  only operate on filenames returned by `getMDXFiles` (real files on disk),
  not on user-supplied strings. Do not add validation there; it's unneeded
  and out of scope.
- Do not set `export const dynamicParams = false` on either page as an
  alternative fix — that would change build/deploy behavior (removing
  on-demand ISR for new slugs) beyond what this plan calls for. The
  containment check in `lib/mdx.ts` is the intended, narrower fix.

## Git workflow

- Branch: `advisor/003-harden-slug-containment`.
- Single commit, message style matches `git log` (e.g.
  `harden getBlogPostBySlug/getProjectBySlug against path traversal`).
- Do NOT push or open a PR unless explicitly instructed.

## Steps

### Step 1: Add a shared containment-check helper

Add a small internal helper near the top of `lib/mdx.ts` (after
`CONTENT_DIR` is defined), used by both slug lookups:

```ts
function resolveContentPath(baseDir: string, slug: string): string | null {
  const filePath = path.join(baseDir, `${slug}.mdx`);
  const resolved = path.resolve(filePath);
  const resolvedBase = path.resolve(baseDir) + path.sep;
  if (!resolved.startsWith(resolvedBase)) return null;
  return resolved;
}
```

This resolves the final path and checks it's still inside `baseDir` — the
same containment technique already implicitly relied on for the "happy path"
(real filenames from `getMDXFiles`), just made explicit and safe for
arbitrary input.

**Verify**: `npx tsc --noEmit` → exit 0 (new function typechecks).

### Step 2: Use the helper in both slug lookups

Update `getBlogPostBySlug`:
```ts
export const getBlogPostBySlug = cache(async (slug: string) => {
  const blogDir = path.join(CONTENT_DIR, "blog");
  const filePath = resolveContentPath(blogDir, slug);
  if (!filePath || !fs.existsSync(filePath)) return null;

  const { data, content } = readMDXFile(filePath);
  return {
    metadata: BlogMetadataSchema.parse(data),
    content,
  };
});
```
Update `getProjectBySlug` the same way against `path.join(CONTENT_DIR, "projects")`.

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 3: Confirm legitimate slugs still resolve, and traversal attempts don't

Run `npx next dev`, then:
- Visit an existing real slug (e.g. whatever `content/blog/*.mdx` currently
  contains — check `ls content/blog` for a real filename minus `.mdx`) at
  `/blog/<that-slug>` and confirm the page still renders exactly as before.
- Visit a traversal attempt, e.g. `/blog/..%2f..%2fpackage` (URL-encoded) and
  confirm it renders the 404 page (`app/not-found.tsx`), not an error page
  or unexpected content.

Stop the dev server when done.

**Verify**: real slug renders correctly; traversal attempt 404s cleanly
(no 500, no unexpected file content).

### Step 4: Full build

**Verify**: `npx next build` → succeeds; `generateStaticParams` for both
routes still produces the same slug list as before this change (spot-check
against `ls content/blog content/projects`).

## Test plan

No test suite exists in this repo (see `plans/README.md`). Verification is
the manual dev-server check in Step 3 plus a successful `next build`. If a
test runner is ever added to this repo, `resolveContentPath` is a pure
function and a natural first unit-test target: assert it returns `null` for
`slug = "../../package"` and a valid path for a real filename.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx next build` exits 0, same slug list as before this change
- [ ] A real existing blog and project slug both still render correctly
      (manual check per Step 3)
- [ ] A traversal-style slug (e.g. `../../package`, tested URL-encoded via
      the dev server) results in the 404 page, not an error or file disclosure
- [ ] No files outside `lib/mdx.ts` are modified (`git status`)
- [ ] `plans/README.md` status row for 003 updated

## STOP conditions

Stop and report back (do not improvise) if:

- Adding the containment check breaks a legitimate, currently-working slug
  (i.e. a real file under `content/blog` or `content/projects` stops
  resolving) — this means the resolution logic doesn't match how
  `CONTENT_DIR`/`blogDir`/`projectDir` are actually constructed elsewhere;
  report the mismatch rather than loosening the check.
- The traversal test in Step 3 still succeeds in reaching content outside
  `content/blog`/`content/projects` after Step 2 — report the exact request
  and response rather than attempting increasingly specific fixes.

## Maintenance notes

- If this repo ever adds more slug-keyed lookups (e.g. a new content type),
  route them through `resolveContentPath` rather than reintroducing a raw
  `path.join` + `existsSync` pattern.
- This fix does not change the public API of `getBlogPostBySlug`/
  `getProjectBySlug` (both still return `null` on a bad/missing slug,
  exactly as before) — callers (`generateMetadata`, the page bodies) need no
  changes.
