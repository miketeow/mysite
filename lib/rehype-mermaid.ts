// lib/rehype-mermaid.ts
import { renderMermaidSVG } from "beautiful-mermaid";
import type { Element, Root } from "hast";
import { fromHtml } from "hast-util-from-html";
import { visit } from "unist-util-visit";

export function rehypeMermaid() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, index, parent) => {
      // A mermaid fence is <pre><code class="language-mermaid">…</code></pre>
      if (node.tagName !== "code" || !parent || index === undefined) return;

      const className = node.properties?.className;
      const isMermaid =
        Array.isArray(className) && className.includes("language-mermaid");
      if (!isMermaid) return;

      // The raw diagram source is the text child of <code>
      const code = node.children
        .filter((c): c is { type: "text"; value: string } => c.type === "text")
        .map((c) => c.value)
        .join("");

      const svg = renderMermaidSVG(code, {
        bg: "var(--background)",
        fg: "var(--foreground)",
        transparent: true,
      });

      // Parse the SVG string into a hast subtree and swap out the whole <pre>
      const svgTree = fromHtml(svg, { fragment: true });
      // parent here is the <pre>; replace it in ITS parent
      Object.assign(parent, {
        tagName: "div",
        properties: { className: ["mermaid-diagram", "not-prose"] },
        children: svgTree.children,
      });
    });
  };
}
