import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next blocks dev-only HMR requests from the HTTPS Preview proxy unless its host is listed.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
