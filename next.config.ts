import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["three"],
  // The Godot web build (public/godot) keeps the same file names each build, so browsers check
  // for a newer copy every visit (a quick 304 when nothing changed).
  async headers() {
    return [{ source: "/godot/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }] }];
  },
};

export default nextConfig;
