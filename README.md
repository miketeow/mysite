# mysite

Mike Teow's personal portfolio and blog — [mikeblog.vercel.app](https://mikeblog.vercel.app).

This isn't a template dump. It's a content-driven Next.js site with a custom MDX rendering pipeline built to support real engineering write-ups: syntax-highlighted diffs, statically pre-rendered Mermaid diagrams, tabbed multi-file code blocks, and a keyboard-driven search — all without shipping a database, an API layer, or client-side Mermaid/Prism bundles.

## What makes this a project, not a boilerplate

- **A custom remark pipeline for code, not just `<pre><code>`.** [`lib/remark-pierre-code.ts`](lib/remark-pierre-code.ts) walks every fenced code block in an MDX file *before* rehype runs and rewrites it into one of three purpose-built JSX components based on fence language: `CodeFile` for plain/tabbed snippets, `PatchDiff` for ` ```diff`/```patch ` fences, and `MultiFileDiff` for ` ```multidiff ` fences (split on a custom `===`-style separator). These render through [`@pierre/diffs`](components/diff/)-backed React components, so diffs in blog posts look like real diff viewers, not colored text.
- **Mermaid diagrams rendered at build time, not in the browser.** [`lib/rehype-mermaid.ts`](lib/rehype-mermaid.ts) finds ` ```mermaid ` fences and replaces them with SVG generated at build time via `beautiful-mermaid`, wired to CSS variables so diagrams repaint correctly across the dark/light theme toggle — with zero client-side Mermaid JS shipped to the browser.
- **A ⌘K command palette backed by statically generated content**, not a hosted search API. [`components/site-search.tsx`](components/site-search.tsx) is a `cmdk`-powered client component fed a small search index assembled server-side in `Header` (an async Server Component) from every blog post and project on disk.
- **A scroll-synced "on this page" TOC** ([`components/on-this-page.tsx`](components/on-this-page.tsx)) driven by an `IntersectionObserver` over `rehypeSlug`-generated heading IDs, shared across blog and project layouts via one `PostLayout` component ([`components/post-layout.tsx`](components/post-layout.tsx)) so both content types get the same sticky 12-column reading layout for free.
- **Zod-validated frontmatter, not stringly-typed content.** [`lib/mdx.ts`](lib/mdx.ts) parses every `.mdx` file with `gray-matter` and validates it against a `BaseMetadataSchema` extended per content type (`BlogMetadataSchema` adds `author`; `ProjectMetadataSchema` adds `repositoryUrl` and `techStack`), with TypeScript types inferred straight from the schema — a malformed post fails at build time, not silently at render time.
- **No database, no API routes, no client-side data fetching.** Every page is statically generated (`generateStaticParams` + `generateMetadata`) by reading MDX off disk through loaders wrapped in React's `cache()`, so a post is parsed once per build regardless of how many routes need its metadata.

## Stack

| Layer          | Choice                                                                                 |
| -------------- | --------------------------------------------------------------------------------------- |
| Framework      | Next.js 16 (App Router, RSC by default), Turbopack                                      |
| Language       | TypeScript (strict mode), React 19                                                      |
| Styling        | Tailwind CSS v4 — CSS-first `@theme` config in [`app/globals.css`](app/globals.css), no `tailwind.config.*` |
| Components     | shadcn/ui (`new-york` style) over Radix primitives, `cmdk` for search                    |
| Content        | MDX on disk, `next-mdx-remote/rsc`, `gray-matter` + `zod` frontmatter validation         |
| Diagrams/code  | `beautiful-mermaid` (build-time SVG), `@pierre/diffs` (diff rendering)                   |
| Theming        | `next-themes` (`class` attribute, system default)                                       |
| Package manager| Bun                                                                                      |

## Getting started

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000). Content lives at `content/blog/*.mdx` and `content/projects/*.mdx` — add a file with valid frontmatter (see the schemas in [`lib/mdx.ts`](lib/mdx.ts)) and it's picked up automatically, including in search, tag pages, and static generation.

Other scripts: `bun run build`, `bun run start`, `bun run lint`.

## Folder layout

```
app/          # App Router pages/layouts only — blog, project, tag routes
components/   # Shared React components; ui/ holds shadcn primitives
components/diff/  # CodeFile, PatchDiff, MultiFileDiff and their shared File/DiffCopyButton primitives
content/      # MDX source of truth (blog/, projects/)
lib/          # Content loader (mdx.ts), remark/rehype plugins, framework-agnostic helpers
config/site.ts     # Site metadata, social links
mdx-components.tsx # Global MDX component map (headings, links, DeepDive, CodeGroup, …)
```

See [CLAUDE.md](CLAUDE.md) for the full architecture writeup, including routing conventions, the frontmatter schema hierarchy, and naming rules enforced by ESLint.

## Deployment

Deployed on Vercel as a fully static build — no server runtime is required beyond what Next.js's App Router build output produces.
