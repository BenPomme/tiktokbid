import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep native/libsql deps out of the webpack graph (README/LICENSE sync imports).
  serverExternalPackages: [
    "@libsql/client",
    "@prisma/adapter-libsql",
    "libsql",
  ],
};

export default nextConfig;
