import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Local browser and Playwright checks use the loopback IP while Next starts
  // on localhost. Next.js 16 requires that alternate dev origin explicitly.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
