import type { Node } from "unist";
import { visit } from "unist-util-visit";

// mdast code-fence node (we avoid a hard dependency on @types/mdast)
interface CodeNode {
  type: "code";
  lang?: string | null;
  meta?: string | null;
  value: string;
}

interface MdxJsxAttribute {
  type: "mdxJsxAttribute";
  name: string;
  value: string;
}

interface MdxJsxFlowElement {
  type: "mdxJsxFlowElement";
  name: string;
  attributes: MdxJsxAttribute[];
  children: [];
}

// Fences we leave untouched for downstream rehype plugins.
const PASSTHROUGH_LANGS = new Set(["mermaid"]);
// Fences rendered as a unified diff via <PatchDiff />.
const DIFF_LANGS = new Set(["diff", "patch"]);
// Fence comparing two full file versions via <MultiFileDiff />.
const MULTI_DIFF_LANG = "multidiff";

function attr(name: string, value: string): MdxJsxAttribute {
  return { type: "mdxJsxAttribute", name, value };
}

// Pull `title="..."` out of the fence meta string (```ts title="foo.ts").
function parseTitle(meta?: string | null): string | undefined {
  if (!meta) return undefined;
  const match = meta.match(/title="([^"]*)"/);
  return match?.[1];
}

// Pull `label="..."` out of the fence meta string — used as the tab trigger in CodeTabs.
function parseLabel(meta?: string | null): string | undefined {
  if (!meta) return undefined;
  const match = meta.match(/label="([^"]*)"/);
  return match?.[1];
}

// Detect bare `showLineNumbers` flag in the fence meta string.
function parseShowLineNumbers(meta?: string | null): boolean {
  return !!meta && /\bshowLineNumbers\b/.test(meta);
}

// Split a ```multidiff body into [oldCode, newCode] on a line of 7+ "=".
function splitMultiDiff(body: string): [string, string] {
  const lines = body.split("\n");
  const sep = lines.findIndex((line) => /^={7,}$/.test(line.trim()));
  if (sep === -1) return [body.trim(), body.trim()];
  return [
    lines.slice(0, sep).join("\n").trim(),
    lines.slice(sep + 1).join("\n").trim(),
  ];
}

export function remarkPierreCode() {
  return (tree: Node) => {
    visit(tree, "code", (node, index, parent) => {
      const container = parent as { children: unknown[] } | null;
      if (!container || typeof index !== "number") return;
      const code = node as unknown as CodeNode;
      const lang = code.lang ?? undefined;

      if (lang && PASSTHROUGH_LANGS.has(lang)) return;

      const title = parseTitle(code.meta);
      let element: MdxJsxFlowElement;

      if (lang && DIFF_LANGS.has(lang)) {
        element = {
          type: "mdxJsxFlowElement",
          name: "PatchDiff",
          attributes: [attr("patch", code.value)],
          children: [],
        };
      } else if (lang === MULTI_DIFF_LANG) {
        const [oldCode, newCode] = splitMultiDiff(code.value);
        const attributes: MdxJsxAttribute[] = [
          attr("oldCode", oldCode),
          attr("newCode", newCode),
          attr("name", title ?? "file"),
        ];
        element = {
          type: "mdxJsxFlowElement",
          name: "MultiFileDiff",
          attributes,
          children: [],
        };
      } else {
        const label = parseLabel(code.meta);
        const showLineNumbers = parseShowLineNumbers(code.meta);
        const attributes: MdxJsxAttribute[] = [attr("code", code.value)];
        if (lang) attributes.push(attr("lang", lang));
        if (title) attributes.push(attr("name", title));
        if (label) attributes.push(attr("label", label));
        if (showLineNumbers) attributes.push(attr("showLineNumbers", "true"));
        element = {
          type: "mdxJsxFlowElement",
          name: "CodeFile",
          attributes,
          children: [],
        };
      }

      container.children.splice(index, 1, element);
    });
  };
}
