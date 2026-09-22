import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Puppeteer/Chromium ship native binaries that must not be bundled by
  // Next.js's own compiler — they need to travel through the serverless
  // function as-is. outputFileTracingIncludes makes sure the Chromium
  // binary actually gets packaged into the function (a common cause of
  // "executable not found" errors on Vercel if left out).
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
  outputFileTracingIncludes: {
    "/api/quotations/[id]/pdf": ["./node_modules/@sparticuz/chromium/**"],
  },
};

export default nextConfig;
