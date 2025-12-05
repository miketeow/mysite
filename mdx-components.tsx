import Link from "next/link";
import { ComponentProps } from "react";

import { ArrowUpRight } from "lucide-react";
import type { MDXComponents } from "mdx/types";

import { CopyButton } from "./components/copy-button";

export function useMDXComponents(): MDXComponents {
  return {
    h1: ({ children, ...props }: ComponentProps<"h1">) => {
      return (
        <h1
          className="text-foreground mb-6 text-2xl font-bold tracking-tight"
          {...props}
        >
          {children}
        </h1>
      );
    },

    h2: ({ children, ...props }: ComponentProps<"h2">) => {
      return (
        <h2
          className="text-foreground mb-6 text-xl font-bold tracking-tight"
          {...props}
        >
          {children}
        </h2>
      );
    },
    h3: ({ children, ...props }: ComponentProps<"h3">) => {
      return (
        <h3
          className="text-foreground mb-6 text-lg font-bold tracking-tight"
          {...props}
        >
          {children}
        </h3>
      );
    },
    a: ({ href, children, ...props }: ComponentProps<"a">) => {
      // internal link
      if (href?.startsWith("/")) {
        return (
          <Link
            href={href}
            className="text-primary decoration-primary/30 hover:decoration-primary font-medium underline underline-offset-4 transition-colors"
            {...props}
          >
            {children}
          </Link>
        );
      }

      // anchor link
      if (href?.startsWith("#")) {
        return (
          <a
            href={href}
            className="text-muted-foreground/80 decoration-muted-foreground/30 hover:text-foreground hover:decoration-foreground font-medium underline decoration-dashed underline-offset-4 transition-all"
            {...props}
          >
            {children}
          </a>
        );
      }

      // external link
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary decoration-primary/30 hover:decoration-primary inline-flex items-center gap-0.5 font-medium underline underline-offset-4 transition-all"
          {...props}
        >
          {children}
          <ArrowUpRight className="size-4 opacity-50" />
        </a>
      );
    },

    blockquote: ({ children, ...props }: ComponentProps<"blockquote">) => {
      return (
        <blockquote
          className="border-primary/40 text-muted-foreground my-6 border-l-4 pl-4 italic"
          {...props}
        >
          {children}
        </blockquote>
      );
    },

    figure: ({
      children,
      ...props
    }: ComponentProps<"figure"> & { "data-raw"?: string }) => {
      // Check if this figure has the 'data-rehype-pretty-code-figure' attribute
      if ("data-rehype-pretty-code-figure" in props) {
        const rawCode = props["data-raw"] || "";

        return (
          <div className="group border-border relative my-6 overflow-hidden rounded-lg border">
            {/* Pass children (the <pre>) directly */}
            {children}

            {/* Pass raw code to button */}
            <CopyButton text={rawCode} />
          </div>
        );
      }

      // Default behavior for other figures (images etc)
      return <figure {...props}>{children}</figure>;
    },
    pre: ({ children, ...props }: ComponentProps<"pre">) => {
      return (
        <pre
          className="m-0! w-full overflow-x-auto p-4 text-sm leading-6"
          {...props}
        >
          {children}
        </pre>
      );
    },
  };
}
