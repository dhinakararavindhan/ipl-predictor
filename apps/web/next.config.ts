import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // shared workspace packages ship as TypeScript source
  transpilePackages: ["@thestands/core"],
  // self-contained server bundle for the Docker image
  output: "standalone",
};

export default nextConfig;
