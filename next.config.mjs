/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["reservation-tea-app.s3.ap-northeast-1.amazonaws.com"],
  },
};

export default nextConfig;
