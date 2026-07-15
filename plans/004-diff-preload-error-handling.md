# Plan 004: Add error handling around `@pierre/diffs` preload calls

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat f2ff6f5..HEAD -- components/diff/code-file.tsx components/diff/code-multi.tsx components/diff/code-patch.tsx`
> If any of these changed since this plan was written, compare the "Current
> state" excerpts against the live code before proceeding; on a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `f2ff6f5`, 2026-07-16

## Why this matters

`CodeFile`, `CodeMultiDiff`, and `CodePatch` (`components/diff/code-file.tsx`,
`code-multi.tsx`, `code-patch.tsx`) are async Server Components rendered
inline by `MDXRemote` for every fenced code block, diff, and multi-file diff
in blog/project content. Each calls directly into `@pierre/diffs/ssr`
(`preloadFile`/`preloadMultiFileDiff`/`preloadPatchDiff`) with content taken
verbatim from the fence body, with no `try`/`catch` anywhere in the call
chain. If any of these throws — e.g. an author writes a ` ```diff ` fence
that isn't a valid unified patch, or a ` ```multidiff ` fence missing the
`===` separator in a way the library rejects, or an unsupported `lang` value
— the thrown error propagates all the way up through `MDXRemote` and fails
the *entire page render*. On a live, resume-linked portfolio site, a single
typo in a future blog post's code fence would 500 the whole post (or worse,
depending on Next.js's error boundary behavior at that route) instead of
degrading gracefully. This is cheap to prevent and meaningfully reduces the
blast radius of a content-authoring mistake.

## Current state

- `components/diff/code-file.tsx:18-33`:
  ```tsx
  export async function CodeFile({ code, lang, name, showLineNumbers }: Props) {
    const data = await preloadFile({
      file: {
        name: name ?? lang ?? "code",
        contents: code,
        lang: lang as SupportedLanguages | undefined,
      },
      options: {
        theme: DIFFS_THEME,
        themeType: "system",
        disableLineNumbers: showLineNumbers !== "true",
      },
    });

    return <File {...data} copyText={code} />;
  }
  ```
- `components/diff/code-multi.tsx:20-33` — same pattern, `preloadMultiFileDiff`,
  returns `<MultiFileDiff {...data} copyText={newCode} />`.
- `components/diff/code-patch.tsx:16-28` — same pattern, `preloadPatchDiff`,
  returns `<PatchDiff {...data} copyText={patch} />`.
- None of the three files import `File`/`MultiFileDiff`/`PatchDiff`'s prop
  shape as optional/nullable — `data` is always spread directly assuming
  success.
- There is currently no fallback/error UI component anywhere in
  `components/diff/` or `components/` for a failed code render.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Build | `npx next build` | succeeds |
| Manual repro | `npx next dev` | see Step 3 |

## Scope

**In scope** (the only files you should modify):
- `components/diff/code-file.tsx`
- `components/diff/code-multi.tsx`
- `components/diff/code-patch.tsx`
- One new small file: `components/diff/code-fallback.tsx` (fallback UI)

**Out of scope** (do NOT touch, even though they look related):
- `components/diff/file.tsx`, `multi-file-diff.tsx`, `patch-diff.tsx`,
  `diff-copy-button.tsx`, `code-tabs.tsx`, `code-tabs-client.tsx` — these
  render successful `data`; no changes needed.
- `lib/remark-pierre-code.ts` — the fence-parsing/routing logic is not the
  problem here; a malformed fence should still route to the same component,
  it's the *rendering* of a malformed body that needs to degrade gracefully.
- Do not attempt to validate diff/patch syntax yourself before calling
  `preload*` — that would duplicate `@pierre/diffs`'s own validation. Catch
  and fall back instead.

## Git workflow

- Branch: `advisor/004-diff-preload-error-handling`.
- Single commit, message style matches `git log` (e.g.
  `add error handling around @pierre/diffs preload calls`).
- Do NOT push or open a PR unless explicitly instructed.

## Steps

### Step 1: Create a shared fallback component

Create `components/diff/code-fallback.tsx`:
```tsx
type Props = {
  code: string;
  lang?: string;
  name?: string;
};

// Rendered when @pierre/diffs fails to preload a fence (e.g. malformed
// diff/patch syntax) — degrades to a plain, unstyled code block instead of
// crashing the whole page.
export function CodeFallback({ code, lang, name }: Props) {
  return (
    <div className="border-border my-6 overflow-hidden rounded-lg border">
      {name && (
        <div className="text-muted-foreground border-border bg-zinc-50 px-4 py-2 font-mono text-xs dark:bg-zinc-900/50">
          {name}
        </div>
      )}
      <pre className="m-0 w-full overflow-x-auto p-4 text-sm leading-6">
        <code className={lang ? `language-${lang}` : undefined}>{code}</code>
      </pre>
    </div>
  );
}
```
(Match the existing dark/light class conventions visible in
`mdx-components.tsx`'s `figcaption`/`pre` overrides — `border-border`,
`bg-zinc-50 dark:bg-zinc-900/50`, `text-muted-foreground` — for visual
consistency with the rest of the site, even though this only renders on the
error path.)

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 2: Wrap each `preload*` call in try/catch

In `components/diff/code-file.tsx`:
```tsx
export async function CodeFile({ code, lang, name, showLineNumbers }: Props) {
  try {
    const data = await preloadFile({
      file: {
        name: name ?? lang ?? "code",
        contents: code,
        lang: lang as SupportedLanguages | undefined,
      },
      options: {
        theme: DIFFS_THEME,
        themeType: "system",
        disableLineNumbers: showLineNumbers !== "true",
      },
    });
    return <File {...data} copyText={code} />;
  } catch {
    return <CodeFallback code={code} lang={lang} name={name} />;
  }
}
```
Import `CodeFallback` from `./code-fallback`.

Apply the same pattern to `components/diff/code-multi.tsx` (wrap the
`preloadMultiFileDiff` call; on catch, render
`<CodeFallback code={newCode} name={name} />` since `MultiFileDiff` doesn't
have a single "lang" concept — use whichever of `oldCode`/`newCode` is more
representative, `newCode` is the reasonable default) and
`components/diff/code-patch.tsx` (wrap `preloadPatchDiff`; on catch, render
`<CodeFallback code={patch} name="patch" />`).

**Verify**: `npx tsc --noEmit` → exit 0.

### Step 3: Manually reproduce and confirm graceful degradation

Run `npx next dev`. Temporarily add a malformed fence to any existing blog
post's MDX (e.g. a ` ```diff ` fence containing plain non-diff text with no
`@@`/`+`/`-` markers), view that post in the browser, confirm it renders the
fallback block instead of crashing the page, then **revert the temporary
content edit** (content files are out of scope for a committed change in
this plan — this is a manual verification step only).

**Verify**: page renders successfully with a plain fallback code block in
place of the malformed fence; no 500/crash. Revert the test content edit
before finishing.

## Test plan

No test suite exists in this repo. Verification is the manual reproduction
in Step 3. If a test runner is ever added, these three components are good
candidates for a rendering test that passes deliberately malformed
diff/patch content and asserts the fallback renders instead of throwing.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx next build` exits 0
- [ ] `grep -n "try {" components/diff/code-file.tsx components/diff/code-multi.tsx components/diff/code-patch.tsx` shows one match per file
- [ ] Manual repro in Step 3 confirms graceful fallback, and the temporary content edit used for the repro is reverted (`git status` shows no changes under `content/`)
- [ ] No files outside the in-scope list are modified or left modified (`git status`)
- [ ] `plans/README.md` status row for 004 updated

## STOP conditions

Stop and report back (do not improvise) if:

- `preload*` calls do not actually throw on malformed input (e.g. they
  return an error-shaped object instead) — this would mean the try/catch is
  a no-op and the real fix is different (checking the returned data shape
  instead). Report what you observe in Step 3 rather than adding a
  non-functional try/catch.
- The fallback component's styling looks visually broken next to real
  `@pierre/diffs` output in a way that seems worse than a plain error — flag
  it rather than iterating extensively on styling (out of scope; functional
  degradation is the goal, not pixel-perfect fallback styling).

## Maintenance notes

- If `@pierre/diffs` is upgraded in the future, re-verify this catch clause
  still triggers on malformed input (an upgrade could change the library's
  error-vs-return-value contract on invalid input).
- `CodeFallback` intentionally does not attempt syntax highlighting — it's a
  degradation path, not a second rendering pipeline. Do not extend it to
  duplicate `@pierre/diffs`'s functionality.
