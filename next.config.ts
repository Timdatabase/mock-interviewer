import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/_python/:path*",
        headers: [{ key: "Access-Control-Allow-Origin", value: "*" }],
      },
    ];
  },
  // Allow the network URLs printed by `next dev` to load dev resources too.
  allowedDevOrigins: Object.values(networkInterfaces()).flatMap((addresses) =>
    (addresses ?? [])
      .filter((address) => address.family === "IPv4" && !address.internal)
      .map((address) => address.address),
  ),
};

export default nextConfig;
