# Plan 007: Remove dead `@next/mdx` configuration and dependencies

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat f2ff6f5..HEAD -- next.config.ts package.json`
> If either file changed since this plan was written (including by plan 002,
> which also edits `package.json` — check whether 002 has already landed and
> adjust the expected "Current state" of `package.json` accordingly), compare
> against the live code before proceeding; on a mismatch beyond an already-
> landed plan 002, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plan 002 (same-file: both edit `package.json`'s
  `dependencies` — run 002 first to avoid a stale diff)
- **Category**: tech-debt
- **Planned at**: commit `f2ff6f5`, 2026-07-16

## Why this matters

`next.config.ts` wraps the Next.js config with `@next/mdx`'s `createMDX()`
and adds `"mdx"` to `pageExtensions`, which enables `.mdx` files under `app/`
to become routes directly. No `.mdx` file exists under `app/` anywhere in
this repo — every actual content page is a `.tsx` file that reads MDX source
from `content/**` via `lib/mdx.ts` and renders it through `next-mdx-remote/rsc`
(`MDXRemote`), a completely separate, self-contained MDX compiler unrelated
to `@next/mdx`'s webpack/turbopack loader. `@mdx-js/loader` and
`@mdx-js/react` (peer packages `@next/mdx` pulls in for its own pipeline) are
also unused — nothing imports `@mdx-js/react`'s `MDXProvider`/
`useMDXComponents` anywhere. This is three dependencies and a config hook
paying for functionality nothing exercises. `CLAUDE.md`'s own
`<!-- NOTES / UNCERTAINTIES -->` block already flags this exact asymmetry as
something the maintainer noticed but hadn't resolved — this plan resolves it
by removing the unused path (the alternative — start authoring some pages as
real `.mdx` routes — is a product decision for the site owner, not something
to decide inside a cleanup plan).

## Current state

- `next.config.ts` (full file):
  ```ts
  import type { NextConfig } from "next";
  import createMDX from "@next/mdx";

  const nextConfig: NextConfig = {
    turbopack: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
    pageExtensions: ["ts", "tsx", "js", "jsx", "mdx"],
  };

  const withMDX = createMDX({});

  export default withMDX(nextConfig);
  ```
- `find app -iname "*.mdx"` returns zero results — confirmed no `.mdx` page
  files exist.
- `grep -rn "@mdx-js" app components lib mdx-components.tsx` returns zero
  results — confirmed no direct usage of either `@mdx-js/*` package.
- `package.json` dependencies include `"@mdx-js/loader": "^3.1.1"`,
  `"@mdx-js/react": "^3.1.1"`, `"@next/mdx": "^16.2.7"` (note: this version
  is already ahead of the pinned `"next": "16.0.7"` — a pre-existing minor
  mismatch, not something to "fix" by pinning versions differently as part
  of this removal; it becomes moot once the package is removed).
- `CLAUDE.md`'s `<!-- NOTES / UNCERTAINTIES -->` block (near the end of the
  file) already states: "`@next/mdx` is installed and wired in
  `next.config.ts`, and `pageExtensions` includes `mdx`, so `.mdx` files in
  `app/` *could* become routes — but none currently exist. All MDX rendering
  goes through `next-mdx-remote/rsc` instead."

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Build | `npx next build` | succeeds, all routes still generate |
| Dev server | `npx next dev` | starts cleanly, SVG imports still work |

## Scope

**In scope** (the only files you should modify):
- `next.config.ts`
- `package.json`
- `CLAUDE.md` (remove the now-resolved `<!-- NOTES / UNCERTAINTIES -->`
  bullet about this asymmetry — it's resolved, not just noted, after this
  plan lands)

**Out of scope**:
- The `turbopack.rules["*.svg"]` block in `next.config.ts` — unrelated,
  keep it exactly as-is (it powers SVG-as-React-component imports used by
  `GithubIcon` etc.).
- Any `.mdx` content under `content/**` — unaffected either way, since
  `next-mdx-remote/rsc` (not `@next/mdx`) is what renders it, and this plan
  doesn't touch that pipeline.
- Do not add a new `.mdx` app route as "proof the config isn't needed" —
  that's scope creep; the plan is to remove unused config, not to add a use
  for it.

## Git workflow

- Branch: `advisor/007-remove-next-mdx`.
- Single commit, message style matches `git log` (e.g.
  `remove unused @next/mdx wiring and dependencies`).
- Do NOT push or open a PR unless explicitly instructed.

## Steps

### Step 1: Confirm zero usage one more time (repo may have drifted)

```
find app -iname "*.mdx"
grep -rn "@mdx-js" app components lib mdx-components.tsx
```
Both expected empty/zero-match. If either finds something, STOP (see below).

### Step 2: Simplify `next.config.ts`

Remove the `createMDX` import and wrapping, and drop `"mdx"` from
`pageExtensions`:
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  pageExtensions: ["ts", "tsx", "js", "jsx"],
};

export default nextConfig;
```

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 3: Remove the three dependencies from `package.json`

Delete these lines from `dependencies`:
```
"@mdx-js/loader": "^3.1.1",
"@mdx-js/react": "^3.1.1",
"@next/mdx": "^16.2.7",
```
Then `bun install` to update the lockfile.

**Verify**: `grep -n "@mdx-js\|@next/mdx" package.json` → no matches.
`bun.lock` diff shows only removals related to these three packages and
their unique transitive deps (not unrelated version bumps).

### Step 4: Update `CLAUDE.md`

Remove the `<!-- NOTES / UNCERTAINTIES -->` bullet about `@next/mdx` being
wired-but-unused (it's resolved now, not an open uncertainty). If the
`<!-- NOTES / UNCERTAINTIES -->` block becomes empty after removing this
bullet, remove the whole comment block; if other bullets remain in it,
leave those alone.

### Step 5: Full verification

**Verify**: `npx next build` → succeeds, same route list as before. `npx
next dev`, spot-check that SVG imports (e.g. `GithubIcon` in
`app/project/[slug]/page.tsx:16`) still render correctly (confirms the
`turbopack.rules` block survived the edit intact).

## Test plan

No test suite exists in this repo. Verification is `next build` succeeding
with an unchanged route list, plus a manual check that SVG-as-component
imports still work (the one other thing `next.config.ts` configures).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx next build` exits 0, identical route list to before this change
- [ ] `grep -n "@mdx-js\|@next/mdx\|createMDX" next.config.ts package.json` returns no matches
- [ ] SVG icon imports (e.g. `GithubIcon`) still render correctly in dev
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row for 007 updated

## STOP conditions

Stop and report back if Step 1's checks find any `.mdx` file under `app/` or
any `@mdx-js` import — this means the repo added a real use for `@next/mdx`
since this plan was written, and removing the config would break it.

## Maintenance notes

- If this site later wants a genuinely static, non-frontmatter-driven page
  (e.g. an "about" or "now" page with no need for the `content/`+Zod+
  `next-mdx-remote` machinery), re-adding `@next/mdx` for just that page is
  a reasonable, cheap choice at that point — this removal doesn't foreclose
  it, it just removes unused-today weight.
