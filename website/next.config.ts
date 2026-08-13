import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withPWA from "next-pwa";

const withNextIntl = createNextIntlPlugin("./lib/i18n.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compress: true,

  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.CDN_HOSTNAME ?? "cdn.example.com",
        pathname: "/**",
      },
    ],
  },

  // Trims client bundles by importing only the icons/components actually used.
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion", "react-hook-form"],
  },

  // Security headers. The CSP itself is set per-request in middleware.ts.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      // Static assets — cache first
      urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|gif|ico|webp|woff2?)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "static-assets",
        expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    {
      // API calls — network first with cache fallback
      urlPattern: /^https:\/\/api\./,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
        networkTimeoutSeconds: 5,
      },
    },
    {
      // Course pages — stale while revalidate
      urlPattern: /\/courses\//,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "course-pages",
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
      },
    },
    {
      // Center microsite pages — stale while revalidate
      urlPattern: /\/c\//,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "center-pages",
        expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
      },
    },
    {
      // Everything else — network first
      urlPattern: /.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "default",
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
        networkTimeoutSeconds: 10,
      },
    },
  ],
});

export default withNextIntl(pwaConfig(nextConfig));
