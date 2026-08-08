import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Monorepo: engine + content are imported from source outside the app dir
  turbopack: {
    root: path.join(__dirname, '../..'),
  },
};

export default nextConfig;
