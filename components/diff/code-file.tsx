import type { SupportedLanguages } from "@pierre/diffs";
import { preloadFile } from "@pierre/diffs/ssr";

import { DIFFS_THEME } from "@/lib/diffs-theme";

import { CodeFallback } from "./code-fallback";
import { File } from "./file";

type Props = {
  code: string;
  lang?: string;
  name?: string;
  showLineNumbers?: string;
};

// Async server component: highlights at build time, hands prerenderedHTML to the
// client File component for hydration (no plain-text flash). The header is always
// shown so the copy button (rendered into the header slot) has a place to live.
export async function CodeFile({ code, lang, name, showLineNumbers }: Props) {
  let data: Awaited<ReturnType<typeof preloadFile>>;
  try {
    data = await preloadFile({
      file: {
        name: name ?? lang ?? "code",
        contents: code,
        lang: lang as SupportedLanguages | undefined,
      },
      options: {
        theme: DIFFS_THEME,
        themeType: "system",
        disableLineNumbers: showLineNumbers !== "true",
      },
    });
  } catch {
    return <CodeFallback code={code} lang={lang} name={name} />;
  }

  return <File {...data} copyText={code} />;
}
