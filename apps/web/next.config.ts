import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for a lean production Docker image.
  output: "standalone",
  // Trace from the monorepo root so the standalone output correctly bundles the
  // pnpm-symlinked workspace packages (@areeza/ui, @areeza/core) and their deps.
  outputFileTracingRoot: path.join(__dirname, "../../"),
  transpilePackages: ["@areeza/ui", "@areeza/core"],
};

export default nextConfig;
