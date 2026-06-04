"use client";

import { Children, type ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Props = {
  labels: string[];
  children: ReactNode;
};

// Client tabs shell. Children are pre-rendered (server) CodeFile nodes — one per
// label, in order. forceMount keeps every panel in the initial HTML so each
// CodeFile's declarative shadow DOM is parsed on load; inactive panels are just
// hidden, so switching tabs is instant and never re-creates a diffs instance.
export function CodeTabsClient({ labels, children }: Props) {
  const panels = Children.toArray(children);
  if (panels.length === 0) return null;

  const value = (i: number) => `tab-${i}`;

  return (
    <Tabs defaultValue={value(0)} className="my-6">
      <TabsList className="bg-muted w-fit">
        {labels.map((label, i) => (
          <TabsTrigger
            key={i}
            value={value(i)}
            // Match diffs.com: active tab uses the page background (darkest in
            // dark mode) for high contrast against the lighter list, instead of
            // shadcn's faint dark:bg-input/30 overlay.
            className="data-[state=active]:dark:bg-background cursor-pointer px-3.5"
          >
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      {panels.map((panel, i) => (
        <TabsContent
          key={i}
          value={value(i)}
          forceMount
          className="mt-0 data-[state=inactive]:hidden"
        >
          {panel}
        </TabsContent>
      ))}
    </Tabs>
  );
}
