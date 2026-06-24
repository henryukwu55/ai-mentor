/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias["sharp$"] = false;
    config.resolve.alias["onnxruntime-node$"] = false;
    config.resolve.alias["encoding$"] = false;
    config.resolve.fallback = { ...(config.resolve.fallback || {}), fs: false };
    return config;
  },
};
module.exports = nextConfig;
