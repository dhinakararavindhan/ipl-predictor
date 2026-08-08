import type { NextConfig } from 'next';
import path from 'path';

// STATIC_EXPORT=1 produces a fully static site (GitHub Pages hosting);
// NEXT_PUBLIC_BASE_PATH (e.g. /ipl-predictor) hosts it under a subpath.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig: NextConfig = {
  // Monorepo: engine + content are imported from source outside the app dir
  turbopack: {
    root: path.join(__dirname, '../..'),
  },
  ...(process.env.STATIC_EXPORT
    ? {
        output: 'export' as const,
        basePath,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
