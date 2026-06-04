"use client";

import {
  MultiFileDiff as PierceMultiFileDiff,
  type MultiFileDiffProps,
} from "@pierre/diffs/react";

import { DiffCopyButton } from "./diff-copy-button";

type Props = MultiFileDiffProps<undefined> & { copyText: string };

export function MultiFileDiff({ copyText, ...props }: Props) {
  return (
    <PierceMultiFileDiff
      {...props}
      renderHeaderMetadata={() => <DiffCopyButton text={copyText} />}
    />
  );
}
