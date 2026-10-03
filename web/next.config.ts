import type { NextConfig } from "next";

const supabaseImagePattern = (() => {
  const value = process.env.SUPABASE_URL;
  if (!value) return [];

  try {
    const url = new URL(value);
    return [
      {
        protocol: url.protocol.slice(0, -1) as "http" | "https",
        hostname: url.hostname,
        port: url.port,
        pathname: "/storage/v1/object/public/recipe-photos/**",
        search: "",
      },
    ];
  } catch {
    return [];
  }
})();

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "4.4mb",
    },
  },
  images: {
    remotePatterns: supabaseImagePattern,
  },
};

export default nextConfig;
