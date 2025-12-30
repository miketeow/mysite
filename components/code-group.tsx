import React from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface CodeGroupProps {
  children: React.ReactNode;
  labels: string[];
}

export default function CodeGroup({ children, labels }: CodeGroupProps) {
  const childArray = React.Children.toArray(children);
  const defaultValue = labels[0].toLowerCase();

  return (
    <Tabs defaultValue={defaultValue} className="my-6">
      <TabsList className="w-full justify-start border-b p-0">
        {labels.map((label) => (
          <TabsTrigger
            key={label}
            value={label.toLowerCase()}
            className="text-muted-foreground bg-muted/30 hover:bg-muted/50 hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-background data-[state=active]:text-foreground dark:bg-secondary/10 dark:hover:bg-secondary/20 dark:data-[state=active]:bg-background relative flex cursor-pointer items-center justify-center gap-2 rounded-none border-b-2 border-transparent px-4 py-2 text-sm font-medium transition-all data-[state=active]:shadow-none"
          >
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      {childArray.map((child, index) => (
        <TabsContent
          key={index}
          value={labels[index].toLowerCase()}
          className="mt-0"
        >
          {child}
        </TabsContent>
      ))}
    </Tabs>
  );
}
