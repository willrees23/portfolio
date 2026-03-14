/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['postgres', 'bcryptjs', 'fluent-ffmpeg'],
};

export default nextConfig;
