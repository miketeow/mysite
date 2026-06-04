"use client";

import { useState } from "react";

import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";

// Copy button styled to match diffs.com. Rendered into the @pierre/diffs header
// via the `header-metadata` slot (renderHeaderMetadata), so it lives inside the
// header layout instead of overlaying the block. Slotted content is light DOM,
// so these Tailwind classes apply and the icon inherits the header's color.
export function DiffCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable (e.g. insecure context) — fail silently
    }
  };

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={copy}
        aria-label="Copy code"
        className={cn(
          "hover:bg-accent -mr-2.5 flex cursor-pointer items-center rounded-sm p-2 opacity-60 transition-opacity hover:opacity-100"
        )}
      >
        {copied ? (
          <Check className="size-4 text-green-500" />
        ) : (
          <Copy className="size-4" />
        )}
      </button>
    </div>
  );
}
