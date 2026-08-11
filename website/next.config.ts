import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withPWA from "next-pwa";

const withNextIntl = createNextIntlPlugin("./lib/i18n.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.CDN_HOSTNAME ?? "cdn.example.com",
        pathname: "/**",
      },
    ],
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
