/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.asics.com" },
    ],
  },
};
module.exports = nextConfig;
