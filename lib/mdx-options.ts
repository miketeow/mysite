import rehypeSlug from "rehype-slug";

import { rehypeMermaid } from "@/lib/rehype-mermaid";
import { remarkPierreCode } from "@/lib/remark-pierre-code";
import { getMDXComponents } from "@/mdx-components";

// Shared MDXRemote configuration for both blog and project detail pages —
// keep the two routes' rendering pipeline identical by construction.
export function getMdxRenderOptions() {
  return {
    components: getMDXComponents(),
    options: {
      mdxOptions: {
        remarkPlugins: [remarkPierreCode],
        rehypePlugins: [rehypeSlug, rehypeMermaid],
      },
    },
  };
}
