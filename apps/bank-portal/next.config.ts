import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  transpilePackages: ["@sqb/api-client", "@sqb/domain-types", "@sqb/ui"]
};

export default nextConfig;
