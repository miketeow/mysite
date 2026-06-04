"use client";

import {
  PatchDiff as PiercePatchDiff,
  type PatchDiffProps,
} from "@pierre/diffs/react";

import { DiffCopyButton } from "./diff-copy-button";

type Props = PatchDiffProps<undefined> & { copyText: string };

export function PatchDiff({ copyText, ...props }: Props) {
  return (
    <PiercePatchDiff
      {...props}
      renderHeaderMetadata={() => <DiffCopyButton text={copyText} />}
    />
  );
}
