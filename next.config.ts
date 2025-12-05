import type { NextConfig } from "next";

import createMDX from "@next/mdx";

import { rehypeCopyLinked } from "./lib/rehype-copy-plugin";

const nextConfig: NextConfig = {
  /* config options here */

  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  pageExtensions: ["ts", "tsx", "js", "jsx", "mdx"],
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
