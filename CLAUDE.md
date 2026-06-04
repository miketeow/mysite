# CLAUDE.md

## Project Brief

`mysite` is a personal portfolio and blog site for Mike Teow, built on Next.js (App Router). Content lives as MDX files on disk under `content/blog` and `content/projects`; the app reads them at build time, validates frontmatter with Zod, and renders them as statically generated pages with syntax-highlighted code blocks, a sliding "on this page" table of contents, a ⌘K command-palette search, dark/light themes, and per-tag index pages. There is no database, no API layer, and no auth — it is a content-driven static site.

## Stack

- **Framework**: Next.js `16.0.7` with the App Router (`app/` directory, RSC by default). Turbopack is configured (see [next.config.ts](next.config.ts)) for `*.svg` → `@svgr/webpack` so SVGs can be imported as React components.
- **Runtime/Language**: React `19.2.1`, TypeScript `^5.9.3` with `strict: true`. Path alias `@/*` → project root (see [tsconfig.json](tsconfig.json)).
- **Package manager**: Bun (a `bun.lock` is committed); scripts themselves just shell out to `next` (`next dev` / `next build` / `next start`).
- **Styling**: Tailwind CSS v4 via `@tailwindcss/postcss`. Note: no `tailwind.config.*` file — theme tokens are declared in CSS using `@theme { … }` and `:root { --color-*: … }` inside [app/globals.css](app/globals.css). `@tailwindcss/typography` is loaded with `@plugin`, and `tw-animate-css` is imported alongside Tailwind.
- **Component primitives**: shadcn/ui (style `new-york`, base color `neutral`, `rsc: true`, icon library `lucide`) — see [components.json](components.json). Generated components live in [components/ui/](components/ui/) and are thin wrappers over Radix primitives (`@radix-ui/react-{avatar,collapsible,dialog,slot,tabs,toggle}`) plus `cmdk` for the command palette.
- **State / theming**: Stateless on the server. Client-side state is local `useState`/`useRef` (e.g. [components/on-this-page.tsx](components/on-this-page.tsx), [components/site-search.tsx](components/site-search.tsx)). Theme is via `next-themes`, mounted in [components/providers.tsx](components/providers.tsx) with `attribute="class"`, `enableSystem`, `defaultTheme="system"`. No Redux / Zustand / Context state library is used.
- **Content & MDX**: `@next/mdx` is wired in [next.config.ts](next.config.ts) (`pageExtensions` includes `mdx`), but MDX bodies are actually rendered through `next-mdx-remote/rsc` (`MDXRemote`). Frontmatter is parsed with `gray-matter` and validated with `zod` (see [lib/mdx.ts](lib/mdx.ts)). The rehype pipeline used at render time is: `rehype-slug` → custom `rehypeExtractRawCode` → (blog only) `rehypeMermaid` → `rehype-pretty-code` (Shiki, themes `github-light` / `github-dark-dimmed`). The project page additionally applies `@shikijs/transformers`' `transformerNotationDiff` ([app/project/[slug]/page.tsx](app/project/[slug]/page.tsx)).
- **Non-obvious libraries**:
  - `beautiful-mermaid` — renders Mermaid diagrams to SVG at build time inside the custom `rehypeMermaid` plugin ([lib/rehype-mermaid.ts](lib/rehype-mermaid.ts)), avoiding a client-side Mermaid bundle.
  - `class-variance-authority` + `tailwind-merge` + `clsx` — the standard shadcn variant/className stack (`cn` helper in [lib/utils.ts](lib/utils.ts)).
  - `cmdk` — powers the ⌘K site search ([components/site-search.tsx](components/site-search.tsx)).
  - `zod` — runtime validation of MDX frontmatter, with TS types inferred from the schemas.

## Conventions

### Folder layout

```
app/                    # App Router pages, layouts, and route segments only
  blog/                 # /blog list + /blog/[slug] post pages (with a layout)
  project/              # /project list + /project/[slug] pages (with a layout)
  tag/[tag]/            # /tag/<tag> index pages (no layout)
  layout.tsx            # root layout: loads Geist fonts, wraps in <Providers>, mounts <Header>
  globals.css           # Tailwind v4 entry, @theme tokens, light/dark CSS vars
components/             # All shared React components, kebab-case files
  ui/                   # shadcn-generated primitives (button, dialog, sheet, command, …)
config/site.ts          # static site metadata (name, urls, social links)
content/                # MDX source-of-truth
  blog/<slug>.mdx
  projects/<slug>.mdx
lib/                    # framework-agnostic helpers (mdx loader, utils, rehype plugins, constants)
mdx-components.tsx      # global MDX component map (h1-h3, a, code, pre, figure, CodeGroup, DeepDive, File, Url, …)
public/                 # static assets, including .svg files imported as React components
```

### Naming

Enforced by `eslint-plugin-check-file` ([eslint.config.mjs](eslint.config.mjs)):

- `**/*.{ts,tsx}` → kebab-case filenames (`ignoreMiddleExtensions: true`).
- `components/**/` → kebab-case folders.
- `app/**/` → `NEXT_JS_APP_ROUTER_CASE` (so dynamic-route folders like `[slug]` and `[tag]` are allowed).

### Component organization

- shadcn primitives stay in [components/ui/](components/ui/) untouched (e.g. `button.tsx`, `badge.tsx`). They export both a component and a `*Variants` CVA function (`buttonVariants`, `badgeVariants`) so callers can apply variant styles to a `Link` without rendering a `<button>`.
- Higher-level site components live directly in `components/` (e.g. [components/header.tsx](components/header.tsx), [components/hero.tsx](components/hero.tsx), [components/on-this-page.tsx](components/on-this-page.tsx)).
- Server components are the default. Client components are opt-in with an explicit `"use client"` at the top — used for anything touching `useTheme`, `useState`, `usePathname`, keyboard listeners, or the IntersectionObserver in `on-this-page.tsx`. `Header` itself is an `async` Server Component that fetches MDX content and passes a small `searchIndex` payload down to the client `SiteSearch`.
- A custom `badge` variant `tag` is defined in [components/ui/badge.tsx:21](components/ui/badge.tsx#L21) and used for blog tag chips.

### Routing

- Pure App Router with file-system routes. No `pages/` directory, no middleware, no route handlers (no `app/api/*` or `route.ts` files exist).
- Dynamic segments use the Next.js 15+ async `params` convention: `type Params = Promise<{ slug: string }>` and pages `await params` (see [app/blog/[slug]/page.tsx:18](app/blog/[slug]/page.tsx#L18)).
- Static generation is opted into per dynamic route via `generateStaticParams` ([app/blog/[slug]/page.tsx:29](app/blog/[slug]/page.tsx#L29), [app/project/[slug]/page.tsx:32](app/project/[slug]/page.tsx#L32), [app/tag/[tag]/page.tsx:12](app/tag/[tag]/page.tsx#L12)) backed by the MDX loaders in `lib/mdx.ts`.
- Per-route metadata uses `generateMetadata` that re-reads the same MDX file; this is cheap because every `lib/mdx.ts` loader is wrapped in React's `cache()` so the file is parsed once per request.
- Each post type owns its own `layout.tsx`: blog has a 12-column grid with a sticky `OnThisPage` aside ([app/blog/[slug]/layout.tsx](app/blog/[slug]/layout.tsx)); project has a minimal `main` wrapper and the page itself renders the aside inline ([app/project/[slug]/layout.tsx](app/project/[slug]/layout.tsx), [app/project/[slug]/page.tsx:188](app/project/[slug]/page.tsx#L188)). (Two different patterns for the same need — worth noting but not necessarily wrong.)
- Custom 404 at [app/not-found.tsx](app/not-found.tsx).

### "API" calls / data fetching

- There is no HTTP API in this project. All data is loaded synchronously from the filesystem at build time through `lib/mdx.ts`, which uses Node's `fs` and `path` directly. Pages call these helpers from server components — they are not React Server Actions, just plain async functions.
- Every loader is wrapped in `cache()` from `react` so that `generateStaticParams`, `generateMetadata`, and the page body all share a single read per file ([lib/mdx.ts:41](lib/mdx.ts#L41), [lib/mdx.ts:46](lib/mdx.ts#L46), [lib/mdx.ts:69](lib/mdx.ts#L69), etc.).
- Frontmatter validation: `BaseMetadataSchema` is `.extend()`-ed into `BlogMetadataSchema` (adds `author`) and `ProjectMetadataSchema` (adds `repositoryUrl`, `techStack`). Types are inferred via `z.infer<...>` and re-exported.

### Imports & formatting

- Prettier config ([.prettierrc.json](.prettierrc.json)): semis on, double quotes, 2-space tabs, `trailingComma: "es5"`.
- `@trivago/prettier-plugin-sort-imports` groups imports in this order: `react`/`next` → third-party → `@/…` → relative. Each group is separated by a blank line. Specifiers within each import are also sorted. This pattern is consistent across every file I sampled.
- `prettier-plugin-tailwindcss` sorts Tailwind class strings.
- ESLint adds: `prefer-arrow-callback`, `prefer-template`, plus the MDX flat configs (`mdx.flat`, `mdx.flatCodeBlocks`) so fenced code inside `.mdx` is linted. Tailwind plugin's `no-custom-classname` is deliberately disabled (comment: the plugin doesn't understand Tailwind v4 CSS variables yet).

## Helper Utilities

- **[lib/utils.ts](lib/utils.ts)** — `cn(...classes)` (the standard `twMerge(clsx(...))` helper), and `formatDate(date: string)` which formats via `toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" })` (i.e. `MM/DD/YYYY` output). Used everywhere a date is rendered.
- **[lib/mdx.ts](lib/mdx.ts)** — the entire content layer:
  - `getBlogPosts()`, `getProjects()` — load and sort by `publishedAt` desc.
  - `getBlogPostBySlug(slug)`, `getProjectBySlug(slug)` — single-file readers returning `null` if missing (callers use `notFound()`).
  - `getAllTags()` — union of tags across both content types.
  - `getPostsByTag(tag)` — returns `{ blogs, projects }` filtered by tag.
  - Schemas/types exported: `BaseMetadataSchema`, `BlogMetadataSchema`, `ProjectMetadataSchema`, `BlogMetadata`, `ProjectMetadata`, `BaseMetadata`.
  - All wrapped in React `cache()`; the internal `readMDXFile` is also cached so two loaders hitting the same file parse it once.
- **[lib/rehype-copy-plugin.ts](lib/rehype-copy-plugin.ts)** — `rehypeExtractRawCode`: walks the HAST tree and copies each `<pre><code>`'s raw text into a `data-raw` attribute on the `<pre>`, so the `figure` MDX component override in [mdx-components.tsx:201](mdx-components.tsx#L201) can hand the unhighlighted source to `<CopyButton />`.
- **[lib/rehype-mermaid.ts](lib/rehype-mermaid.ts)** — `rehypeMermaid`: finds ```` ```mermaid ```` fences and replaces the `<pre>` with a pre-rendered SVG produced by `beautiful-mermaid`'s `renderMermaidSVG`. Background/foreground are wired to CSS vars so dark mode picks them up. Currently applied **only on the blog route**, not on project pages (the project page's rehype plugins list omits it — [app/project/[slug]/page.tsx:177](app/project/[slug]/page.tsx#L177)).
- **[lib/constants.ts](lib/constants.ts)** — `navLinks` array used by both [components/main-nav.tsx](components/main-nav.tsx) and [components/mobile-nav.tsx](components/mobile-nav.tsx).
- **[config/site.ts](config/site.ts)** — `siteConfig` (name, url, description, author, social links) and `SiteConfig` type.
- **[mdx-components.tsx](mdx-components.tsx)** — `getMDXComponents()` returns the component map handed to every `MDXRemote`. It overrides `h1`–`h3`, `a` (with three branches: internal `Link`, anchor, external with `ArrowUpRight`), `blockquote`, `figure` (detects `data-rehype-pretty-code-figure` and wraps in a `CopyButton`), `figcaption` (styles `rehype-pretty-code` titles), `pre`, `code` (inline vs block via `data-language` sniff), and exposes three custom MDX-only components: `File`, `Url`, `DeepDive` (a `Collapsible`-based expandable section), plus `CodeGroup`.
- **No `hooks/` directory exists**. `components.json` declares an alias `"hooks": "@/hooks"`, but the folder isn't present and nothing imports from it — all hook-shaped logic is currently inlined into the client components that use it (e.g. the heading observer in [components/on-this-page.tsx](components/on-this-page.tsx), the ⌘K listener in [components/site-search.tsx](components/site-search.tsx)).

<!-- NOTES / UNCERTAINTIES
- I didn't find a tailwind.config.{ts,js,mjs} file. Tailwind v4 supports CSS-first config via @theme, and globals.css uses it, so this appears intentional rather than missing.
- `bun.lock` is present and the README mentions bun, but package.json `scripts` only invoke `next` directly. I did not find a project-level statement that bun is required vs. npm/pnpm — calling it the package manager based on the committed lockfile only.
- @next/mdx is installed and wired in next.config.ts, and `pageExtensions` includes `mdx`, so .mdx files in `app/` *could* become routes — but none currently exist. All MDX rendering goes through next-mdx-remote/rsc instead. I'm noting this rather than declaring which is "the" pattern.
-->

## What to avoid
- Do not suggest useEffect for data fetching — we use [React Query / server components / etc.]
- Do not add new dependencies without flagging it as a decision point

## Workflow

I write all code myself. Your job is to understand the repo, propose plans,
and suggest exact implementation details. Do not output file diffs unless I ask.

- When you flag a bug, typo, or improvement, do NOT re-read or re-scan 
  files to verify I've addressed it.
- If I say "I've fixed X" or "done," trust that statement and treat that 
  file as current in your understanding. Do not re-open it to confirm.
- Only re-read a file if I explicitly ask, or if I tell you the contents 
  have changed in a way relevant to the current task.
