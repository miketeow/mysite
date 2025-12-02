export const navLinks = [
  { name: "Home", href: "/" },
  { name: "Blog", href: "/blog" },
  { name: "Project", href: "/project" },
];

export const tags = [
  "javascript",
  "mdx",
  "nextjs",
  "blog",
  "project",
  "auth",
  "codecrafter",
  "leetcode",
  "ai",
  "nuxt",
  "rust",
  "c",
  "book",
  "review",
  "vite",
  "react",
] as const;
export type TagType = (typeof tags)[number];
