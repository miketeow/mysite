type Props = {
  code: string;
  lang?: string;
  name?: string;
};

// Rendered when @pierre/diffs fails to preload a fence (e.g. malformed
// diff/patch syntax) — degrades to a plain, unstyled code block instead of
// crashing the whole page.
export function CodeFallback({ code, lang, name }: Props) {
  return (
    <div className="border-border my-6 overflow-hidden rounded-lg border">
      {name && (
        <div className="text-muted-foreground border-border bg-zinc-50 px-4 py-2 font-mono text-xs dark:bg-zinc-900/50">
          {name}
        </div>
      )}
      <pre className="m-0 w-full overflow-x-auto p-4 text-sm leading-6">
        <code className={lang ? `language-${lang}` : undefined}>{code}</code>
      </pre>
    </div>
  );
}
