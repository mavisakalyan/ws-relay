import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: [
    "@mavisakalyan/ws-relay-protocol",
    "@mavisakalyan/ws-relay-client",
    "@mavisakalyan/ws-relay-react",
  ],
};

export default nextConfig;
