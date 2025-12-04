"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Box, FileText, Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "./ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./ui/command";

interface SearchProps {
  title: string;
  description: string;
  slug: string;
  type: "Blog" | "Project";
}

export default function SiteSearch({ data }: { data: SearchProps[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { setTheme } = useTheme();

  // toggle with key (cmd + k)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "k" && e.metaKey) || e.ctrlKey) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // helper to close search and navigate
  const runCommand = useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      {/* trigger button */}
      <Button
        variant="outline"
        className="bg-background text-muted-foreground relative h-9 w-[150px] justify-start rounded-xl text-sm font-normal shadow-none sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <span className="hidden lg:inline-flex">Search Website...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="bg-muted pointer-events-none absolute top-[0.4rem] right-[0.3rem] hidden h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* the modal dialog */}

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..."></CommandInput>
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* blogs and projects */}
          <CommandGroup heading="Results">
            {data.map((item) => (
              <CommandItem
                key={item.slug}
                // `item` prefix help fuzzy search
                value={`${item.type} ${item.title}`}
                onSelect={() => {
                  runCommand(() => router.push(item.slug));
                }}
              >
                {item.type === "Blog" ? (
                  <FileText className="mr-2 size-4" />
                ) : (
                  <Box className="mr-2 size-4" />
                )}

                <span>{item.title}</span>
                <span className="text-muted-foreground bg-muted ml-auto rounded px-1.5 py-0.5 text-xs">
                  {item.type}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          {/* system actions */}
          <CommandGroup heading="Theme">
            <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
              <Sun className="mr-2 size-4" />
              Light
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
              <Moon className="mr-2 size-4" />
              Dark
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
              <Laptop className="mr-2 size-4" />
              System
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
