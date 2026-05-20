import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import checkFile from "eslint-plugin-check-file";
import * as mdx from "eslint-plugin-mdx";
import tailwind from "eslint-plugin-tailwindcss";
import { defineConfig, globalIgnores } from "eslint/config";

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
          ignoreMiddleExtensions: true,
        },
      ],

      // Enforce kebab-case for folder names
      "check-file/folder-naming-convention": [
        "error",
        {
          // FIX 1: Support Next.js dynamic routes like [slug]
          "app/**/": "NEXT_JS_APP_ROUTER_CASE",
          "components/**/": "KEBAB_CASE",
        },
      ],
    },
  },

  // 2. Tailwind CSS Rules
  ...tailwind.configs["flat/recommended"],
  {
    rules: {
      // FIX 2: Disable strict classname checking.
      // The plugin cannot read Tailwind v4 CSS variables yet.
      "tailwindcss/no-custom-classname": "off",
    },
  },

  // 3. Markdown and Code Block Safety
  {
    ...mdx.flat,
    files: ["**/*.md", "**/*.mdx"],
    processor: mdx.createRemarkProcessor({
      lintCodeBlocks: true,
      languageMapper: {},
    }),
  },
  {
    ...mdx.flatCodeBlocks,
    files: ["**/*.md", "**/*.mdx"],
    rules: {
      ...mdx.flatCodeBlocks.rules,
      "no-console": "off",
      "no-undef": "error",
    },
  },

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    "bun.lockb",
  ]),
]);

export default eslintConfig;
