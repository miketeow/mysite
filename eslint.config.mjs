import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tailwind from "eslint-plugin-tailwindcss";
import * as mdx from "eslint-plugin-mdx";
import checkFile from "eslint-plugin-check-file";
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // 1. Formatting and Naming Conventions
  {
    plugins: {
      "check-file": checkFile,
    },
    rules: {
      // Enforce Arrow Functions
      "prefer-arrow-callback": "error",
      // Enforce template literals (`${var}`) over string concatenation (`str + str`)
      "prefer-template": "error",

      // Enforce kebab-case for filenames
      "check-file/filename-naming-convention": [
        "error",
        {
          "**/*.{ts,tsx}": "KEBAB_CASE",
        },
        {
          // Ignore next.config.ts or data.test.js, ignore the middle extension like config or test
          ignoreMiddleExtensions: true,
        },
      ],

      // Enforce kebab-case for folder names
      "check-file/folder-naming-convention": [
        "error",
        {
          "app/**/": "KEBAB_CASE",
          "components/**/": "KEBAB_CASE",
        },
      ],
    },
  },

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
    "node_modules/**",
    "bun.lockb",
  ]),
]);

export default eslintConfig;
