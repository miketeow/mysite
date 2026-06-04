import { Children, isValidElement, type ReactElement, type ReactNode } from "react";

import { CodeTabsClient } from "./code-tabs-client";

type CodeFileProps = { name?: string; lang?: string; label?: string };

// Server wrapper authored as <CodeTabs> with fenced code blocks inside. The
// remark-pierre-code plugin turns those inner fences into <CodeFile> children;
// here we read each child's title/lang for the tab label, then hand the
// already-rendered CodeFile nodes to the client tabs shell.
export function CodeTabs({ children }: { children?: ReactNode }) {
  const items = Children.toArray(children).filter(
    isValidElement
  ) as ReactElement<CodeFileProps>[];

  if (items.length === 0) return null;

  const labels = items.map(
    (el, i) => el.props.label ?? el.props.name ?? el.props.lang ?? `Tab ${i + 1}`
  );

  return <CodeTabsClient labels={labels}>{items}</CodeTabsClient>;
}
