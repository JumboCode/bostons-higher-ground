import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Excel parsing runs only in the Node admin route. Keep its filesystem/ZIP
    // dependencies out of Turbopack's application bundle.
    serverExternalPackages: ["read-excel-file", "yauzl"],
};

export default nextConfig;
