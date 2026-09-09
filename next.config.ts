import type { NextConfig } from "next";
import packageJson from "./package.json";
import buildInfo from "./build-info.json";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@libsql/client'],
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
    NEXT_PUBLIC_BUILD_ID: String(buildInfo.buildNumber),
  },
};

export default nextConfig;
