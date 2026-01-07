import Link from "next/link";
import { ComponentProps } from "react";

import { ArrowUpRight, FileCode, Folder } from "lucide-react";
import type { MDXComponents } from "mdx/types";

import CodeGroup from "@/components/code-group";
import { cn } from "@/lib/utils";

import { CopyButton } from "./components/copy-button";

export function useMDXComponents(): MDXComponents {
  return {
    CodeGroup,
    // 1. File Component (The "Soft Indigo Chip")
    File: ({
      children,
      className,
    }: {
      children: React.ReactNode;
      className?: string;
    }) => (
      <span
        className={cn(
          "rounded-md px-1.5 py-0.5 font-mono text-[0.9em] font-medium transition-colors",
          // Light: Indigo text with very subtle background
          "bg-indigo-50 text-indigo-700",
          // Dark: Bright Indigo text with transparent background
          "dark:bg-indigo-500/10 dark:text-indigo-300",
          className
        )}
      >
        {children}
      </span>
    ),
    // 2. Url Component (The "Soft Emerald Chip")
    Url: ({
      children,
      className,
    }: {
      children: React.ReactNode;
      className?: string;
    }) => (
      <span
        className={cn(
          "rounded-md px-1.5 py-0.5 font-mono text-[0.9em] font-medium transition-colors",
          // Light: Emerald text with very subtle background
          "bg-emerald-50 text-emerald-700",
          // Dark: Bright Emerald text with transparent background
          "dark:bg-emerald-500/10 dark:text-emerald-300",
          className
        )}
      >
        {children}
      </span>
    ),
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

    // NEW: Handle the Code Block Title
    figcaption: ({ children, ...props }: ComponentProps<"figcaption">) => {
      // Guard: Only apply this style to rehype-pretty-code titles
      if ("data-rehype-pretty-code-title" in props) {
        return (
          <figcaption
            className={cn(
              // Layout
              "w-full border-b px-4 py-2.5",
              // Typography
              "mt-0!",
              "text-muted-foreground font-mono text-xs font-medium",
              // Colors (Subtle distinction from the code block background)
              "border-border bg-zinc-50 dark:bg-zinc-900/50",
              props.className
            )}
            {...props}
          >
            {/* We can add a File Icon here if we want to enforce it for all titles */}
            {children}
          </figcaption>
        );
      }

      // Fallback for standard image captions
      return <figcaption {...props}>{children}</figcaption>;
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
      const isBlock = "data-theme" in props || "data-language" in props;

      if (!isBlock) {
        return (
          <code
            className={cn(
              "font-mono text-[0.9em] font-semibold",
              // Light: Vivid Rose/Pink (classic string/variable color)
              "text-rose-600",
              // Dark: Soft Rose
              "dark:text-rose-400",
              className
            )}
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
