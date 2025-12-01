import type { NextConfig } from "next";

import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  /* config options here */
  pageExtensions: ["ts", "tsx", "js", "jsx", "mdx"],
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
