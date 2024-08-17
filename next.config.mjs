/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "reservation-tea-app.s3.ap-northeast-1.amazonaws.com",
      "amplify-moshimoji-root-sandbox-1-teabucket26470cb4-m9df2bygeb2t.s3.ap-northeast-1.amazonaws.com",
    ],
  },
};

export default nextConfig;
