import Link from "next/link";
import { ComponentProps } from "react";

import { ArrowUpRight } from "lucide-react";
import type { MDXComponents } from "mdx/types";

import CodeGroup from "@/components/code-group";
import { cn } from "@/lib/utils";

import { CopyButton } from "./components/copy-button";

export function useMDXComponents(): MDXComponents {
  return {
    CodeGroup,
    h1: ({ className, children, ...props }: ComponentProps<"h1">) => {
      return (
        <h1
          className={cn(
            "text-foreground mt-12 mb-6 text-3xl font-bold tracking-tight",
            className
          )}
          {...props}
        >
          {children}
        </h1>
      );
    },

    h2: ({ className, children, ...props }: ComponentProps<"h2">) => {
      return (
        <h2
          className={cn(
            "text-foreground mt-10 mb-4 text-2xl font-bold tracking-tight",
            className
          )}
          {...props}
        >
          {children}
        </h2>
      );
    },
    h3: ({ className, children, ...props }: ComponentProps<"h3">) => {
      return (
        <h3
          className={cn(
            "text-foreground mt-8 mb-4 text-xl font-bold tracking-tight",
            className
          )}
          {...props}
        >
          {children}
        </h3>
      );
    },

    a: ({ href, children, ...props }: ComponentProps<"a">) => {
      if (!href) {
        return <span {...props}>{children}</span>;
      }
      const isInternal = href.startsWith("/");
      const isAnchor = href.startsWith("#");

      const baseStyles =
        "font-medium underline underline-offset-4 decoration-primary/30 hover:decoration-primary transition-colors text-primary";
      // internal link
      if (isInternal) {
        return (
          <Link
            href={href}
            className={cn(baseStyles, props.className)}
            {...props}
          >
            {children}
          </Link>
        );
      }

      // anchor link
      if (isAnchor) {
        return (
          <a
            href={href}
            className={cn(
              "text-muted-foreground/80 hover:text-foreground decoration-dashed transition-all",
              baseStyles,
              props.className
            )}
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
          className={cn(
            "inline-flex items-center gap-0.5",
            baseStyles,
            props.className
          )}
          {...props}
        >
          {children}
          <ArrowUpRight className="size-4 opacity-50" />
          <span className="sr-only">(opens in a new tab)</span>
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
    pre: ({ children, className, ...props }: ComponentProps<"pre">) => {
      return (
        <pre
          className={cn(
            "m-0! w-full overflow-x-auto p-4 text-sm leading-6",
            className
          )}
          {...props}
        >
          {children}
        </pre>
      );
    },
    // neutral inline code
    code: ({ children, className, ...props }: ComponentProps<"code">) => {
      const isInline = !className;

      if (isInline) {
        return (
          <code
            className="bg-muted text-foreground relative rounded px-[0.3rem] py-[0.1rem] font-mono text-sm font-medium"
            {...props}
          >
            {children}
          </code>
        );
      }

      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };
}
