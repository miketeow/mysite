"use client";

import { File as PierreFile, type FileProps } from "@pierre/diffs/react";

import { DiffCopyButton } from "./diff-copy-button";

type Props = FileProps<undefined> & { copyText: string };

export function File({ copyText, ...props }: Props) {
  return (
    <PierreFile
      {...props}
      renderHeaderMetadata={() => <DiffCopyButton text={copyText} />}
    />
  );
}
