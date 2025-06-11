import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": require("path").resolve(__dirname, "./"),
      "@/convex": require("path").resolve(__dirname, "./convex"),
      "@/src": require("path").resolve(__dirname, "./src"),
    };
    return config;
  },
};

export default nextConfig;
