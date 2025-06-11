import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": resolve(__dirname),
      "@/convex": resolve(__dirname, "convex"),
      "@/src": resolve(__dirname, "src"),
    };
    return config;
  },
};

export default nextConfig;
