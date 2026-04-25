import type { NextConfig } from "next";

const nextConfig = {
  /* config options here */
  // output: "standalone",
  reactCompiler: true,
  allowedDevOrigins: ["58bb-103-211-16-175.ngrok-free.app"],
  async headers() {
    return [
      {
        source: "/project/(.*)",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
      {
        source: "/webcontainer/connect/:path*",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "unsafe-none",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "unsafe-none",
          },
        ],
      },
      {
        source: "/pricing",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "unsafe-none",
          },
        ],
      },
    ];
  },
} as NextConfig;

export default nextConfig;
