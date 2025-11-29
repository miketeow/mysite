import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tailwind from "eslint-plugin-tailwindcss";
import * as mdx from "eslint-plugin-mdx";
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // 2. Tailwind CSS Rules
  // Will warn you if you write bg-red-999 (doesn't exist) or have conflicting classes
  ...tailwind.configs["flat/recommended"],

  // 3. Markdown and Code Block Safety
  {
    ...mdx.flat,
    files: ["**/*.md", "**/*.mdx"],
    processor: mdx.createRemarkProcessor({
      lintCodeBlocks: true, // enable spellchecker for JS block
      languageMapper: {},
    }),
  },
  {
    ...mdx.flatCodeBlocks,
    files: ["**/*.md", "**/*.mdx"],
    rules: {
      ...mdx.flatCodeBlocks.rules,
      "no-console": "off", // Allow console.log in tutorial
      "no-undef": "error", // Catch typos
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
