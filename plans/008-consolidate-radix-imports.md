# Plan 008: Consolidate duplicate Radix dependency strategy

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat f2ff6f5..HEAD -- package.json components/ui/tabs.tsx`
> If either file changed since this plan was written (including by plans 002
> or 007, which also edit `package.json` — confirm whether they've landed and
> adjust expectations accordingly), compare against the live code before
> proceeding; on an unexplained mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans 002, 007 (same-file: all three edit `package.json`'s
  `dependencies` — run in numeric order)
- **Category**: tech-debt
- **Planned at**: commit `f2ff6f5`, 2026-07-16

## Why this matters

`package.json` lists both the combined `radix-ui` meta-package (`^1.5.0`)
and six individual `@radix-ui/react-*` packages (`avatar`, `collapsible`,
`dialog`, `slot`, `tabs`, `toggle`) as separate dependencies. Every
`components/ui/*.tsx` primitive imports from the individual packages
directly — `avatar.tsx`, `button.tsx`, `badge.tsx`, `sheet.tsx`,
`toggle.tsx`, `collapsible.tsx`, `dialog.tsx` — except `tabs.tsx`, which
alone imports `Tabs` from the `radix-ui` meta-package. This means
`@radix-ui/react-tabs` is a listed direct dependency with zero direct
importers (only reachable indirectly via the meta-package's re-export), and
the `radix-ui` meta-package itself exists in `package.json` for exactly one
import. Two ways to reach the same primitives with no consistent convention
means the next component author will guess differently. Standardizing on the
individual-package convention (6 of 7 current usages already do this,
matching shadcn/ui's own default convention) removes the meta-package
entirely.

## Current state

- `package.json` `dependencies` (relevant lines):
  ```
  "@radix-ui/react-avatar": "^1.1.12",
  "@radix-ui/react-collapsible": "^1.1.13",
  "@radix-ui/react-dialog": "^1.1.16",
  "@radix-ui/react-slot": "^1.2.5",
  "@radix-ui/react-tabs": "^1.1.14",
  "@radix-ui/react-toggle": "^1.1.11",
  ...
  "radix-ui": "^1.5.0",
  ```
- Confirmed import sites (via `grep -n "radix-ui" components/ui/*.tsx`):
  ```
  components/ui/avatar.tsx:4:import * as AvatarPrimitive from "@radix-ui/react-avatar"
  components/ui/button.tsx:2:import { Slot } from "@radix-ui/react-slot"
  components/ui/badge.tsx:3:import { Slot } from "@radix-ui/react-slot";
  components/ui/sheet.tsx:4:import * as SheetPrimitive from "@radix-ui/react-dialog"
  components/ui/toggle.tsx:5:import * as TogglePrimitive from "@radix-ui/react-toggle";
  components/ui/collapsible.tsx:3:import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
  components/ui/dialog.tsx:4:import * as DialogPrimitive from "@radix-ui/react-dialog"
  components/ui/tabs.tsx:5:import { Tabs as TabsPrimitive } from "radix-ui"
  ```
  `tabs.tsx` is the sole outlier.
- `components/ui/tabs.tsx` (full file) uses `TabsPrimitive.Root`,
  `TabsPrimitive.List`, `TabsPrimitive.Trigger`, `TabsPrimitive.Content` —
  all standard exports also available directly from `@radix-ui/react-tabs`
  under the same names (`Root`, `List`, `Trigger`, `Content`), since the
  `radix-ui` meta-package is just a re-export surface over the individual
  packages, not a different API.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | exit 0 |
| Build | `npx next build` | succeeds |
| Manual check | `npx next dev` | Tabs-based UI (command palette / CodeTabs / CodeGroup) still works |

## Scope

**In scope** (the only files you should modify):
- `components/ui/tabs.tsx`
- `package.json`

**Out of scope**:
- Every other file in `components/ui/` — already correct, do not touch.
- `components/diff/code-tabs-client.tsx` and `components/code-group.tsx` —
  these import `Tabs`/`TabsContent`/`TabsList`/`TabsTrigger` from
  `@/components/ui/tabs` (the wrapper, not Radix directly) — no changes
  needed there; they're unaffected by which underlying Radix import
  `tabs.tsx` itself uses.

## Git workflow

- Make edits directly in the working tree on the current branch. Do not
  create a new branch and do not commit.
- Do NOT push or open a PR unless explicitly instructed.

## Steps

### Step 1: Swap `tabs.tsx`'s import to the individual package

In `components/ui/tabs.tsx`, change:
```ts
import { Tabs as TabsPrimitive } from "radix-ui";
```
to:
```ts
import * as TabsPrimitive from "@radix-ui/react-tabs";
```
(matching the `import * as XPrimitive from "@radix-ui/react-x"` style used
by every other file in `components/ui/`). No other code in the file should
need to change — `TabsPrimitive.Root`/`.List`/`.Trigger`/`.Content` are the
same exports either way.

**Verify**: `npx tsc --noEmit` → exit 0 (confirms the individual package's
type exports match what `tabs.tsx` uses).

### Step 2: Remove the `radix-ui` meta-package dependency

In `package.json`, delete:
```
"radix-ui": "^1.5.0",
```
Then `bun install` to update the lockfile.

**Verify**: `grep -rn "from \"radix-ui\"" components` → no matches.
`grep -n "\"radix-ui\":" package.json` → no matches.

### Step 3: Manual check of every Tabs consumer

Tabs (via `components/ui/tabs.tsx`) is used by `components/code-group.tsx`
(`CodeGroup`, currently unused by content) and
`components/diff/code-tabs-client.tsx` (`CodeTabsClient`, used whenever a
` <CodeTabs> ` MDX block appears in content — check `content/**` for any
` <CodeTabs> ` usage to know whether you can verify this live, e.g.
`grep -rln "CodeTabs" content`). If a live example exists, view it via
`next dev` and confirm tabs still switch correctly. If none exists in
current content, at minimum confirm the site's ⌘K command palette
(`components/site-search.tsx`, which uses `cmdk`, not this `Tabs`
component — check whether anything else in the site actually renders
`Tabs` at all today) or any other live `Tabs` usage still works.

**Verify**: whichever live `Tabs` usage you find still renders and switches
tabs correctly with no console errors.

### Step 4: Full build

**Verify**: `npx next build` → succeeds.

## Test plan

No test suite exists in this repo. Verification is `tsc --noEmit`, a
successful build, and the manual Tabs-switching check in Step 3.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx next build` exits 0
- [ ] `grep -rn "from \"radix-ui\"" components` returns no matches
- [ ] `grep -n "\"radix-ui\":" package.json` returns no matches
- [ ] Manual Tabs check in Step 3 confirms no regression
- [ ] No files outside `components/ui/tabs.tsx` and `package.json` are modified (`git status`)
- [ ] `plans/README.md` status row for 008 updated

## STOP conditions

Stop and report back if `tsc --noEmit` fails after Step 1 with a type
mismatch between the meta-package's `Tabs` export and the individual
`@radix-ui/react-tabs` package's exports — this would mean the two aren't
drop-in equivalents for this version pair, and the fix needs reconsidering
rather than forcing a type-cast to make it compile.

## Maintenance notes

- Going forward, new `components/ui/*.tsx` primitives added via shadcn's CLI
  should default to individual `@radix-ui/react-*` imports to match this
  now-consistent convention, not the `radix-ui` meta-package.
