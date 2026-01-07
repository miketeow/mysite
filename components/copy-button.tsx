"use client";

import { useState } from "react";

import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  text: string;
  className?: string;
}

export function CopyButton({ text, className }: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        "bg-muted/50 hover:bg-muted absolute top-10 right-4 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100",
        className
      )}
      onClick={copy}
      aria-label="Copy code"
    >
      {isCopied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="text-muted-foreground h-4 w-4" />
      )}
    </Button>
  );
}
