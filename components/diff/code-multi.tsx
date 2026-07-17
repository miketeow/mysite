import { preloadMultiFileDiff } from "@pierre/diffs/ssr";

import { DIFFS_THEME } from "@/lib/diffs-theme";

import { CodeFallback } from "./code-fallback";
import { MultiFileDiff } from "./multi-file-diff";

type Props = {
  name: string;
  oldCode: string;
  newCode: string;
  oldName?: string;
};

// Hides the built-in +/- line-count stats (shadow DOM), freeing the header slot
// for the copy button.
const HIDE_STATS = "[data-deletions-count],[data-additions-count]{display:none}";

// Compares two file versions. Authored via the ```multidiff fence, which the
// remark-pierre-code plugin splits into oldCode/newCode.
export async function CodeMultiDiff({ name, oldCode, newCode, oldName }: Props) {
  try {
    const data = await preloadMultiFileDiff({
      oldFile: { name: oldName ?? name, contents: oldCode },
      newFile: { name, contents: newCode },
      options: {
        theme: DIFFS_THEME,
        themeType: "system",
        diffStyle: "split",
        unsafeCSS: HIDE_STATS,
      },
    });

    return <MultiFileDiff {...data} copyText={newCode} />;
  } catch {
    return <CodeFallback code={newCode} name={name} />;
  }
}
