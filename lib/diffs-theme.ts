import type { ThemesType } from "@pierre/diffs";

// Dual theme handed to every @pierre/diffs component. The shadow DOM switches
// between these via CSS `light-dark()`, driven by next-themes' color-scheme.
// Pierre's own themes match the diffs.com palette.
export const DIFFS_THEME: ThemesType = {
  dark: "pierre-dark",
  light: "pierre-light",
};
