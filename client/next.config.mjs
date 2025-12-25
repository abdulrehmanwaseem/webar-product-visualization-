/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "**.cloudflare.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/ar/:path*",
        headers: [
          {
            key: "Permissions-Policy",
            value: "xr-spatial-tracking=(self)",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
