import type { Element, Root, Text } from "hast";
import { visit } from "unist-util-visit";

export const rehypeExtractRawCode = () => {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName === "pre") {
        const codeEl = node.children[0];

        if (codeEl && codeEl.type === "element" && codeEl.tagName === "code") {
          const textNode = codeEl.children[0] as Text;

          if (textNode && textNode.type === "text") {
            node.properties = node.properties || {};
            node.properties["data-raw"] = textNode.value;
          }
        }
      }
    });
  };
};
