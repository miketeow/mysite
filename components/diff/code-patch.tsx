import { preloadPatchDiff } from "@pierre/diffs/ssr";

import { DIFFS_THEME } from "@/lib/diffs-theme";

import { CodeFallback } from "./code-fallback";
import { PatchDiff } from "./patch-diff";

type Props = {
  patch: string;
};

// Hides the built-in +/- line-count stats (they live in shadow DOM, so only
// unsafeCSS can reach them), leaving the header slot free for the copy button.
const HIDE_STATS = "[data-deletions-count],[data-additions-count]{display:none}";

// Async server component: renders a unified diff/patch string via @pierre/diffs.
export async function CodePatch({ patch }: Props) {
  let data: Awaited<ReturnType<typeof preloadPatchDiff<undefined>>>;
  try {
    data = await preloadPatchDiff({
      patch,
      options: {
        theme: DIFFS_THEME,
        themeType: "system",
        diffStyle: "split",
        unsafeCSS: HIDE_STATS,
      },
    });
  } catch {
    return <CodeFallback code={patch} name="patch" />;
  }

  return <PatchDiff {...data} copyText={patch} />;
}
