import { visit } from "unist-util-visit";

export const rehypeCopyLinked = () => {
  return (tree: any) => {
    visit(tree, (node) => {
      if (node?.type === "element" && node?.tagName === "pre") {
        const [codeEl] = node.children;
        if (codeEl.tagName !== "code") return;

        // Extract the raw text from the code block
        const rawText = codeEl.children[0].value;

        // Attach it as a property to the <pre> tag
        node.properties["data-raw"] = rawText;
      }
    });
  };
};
