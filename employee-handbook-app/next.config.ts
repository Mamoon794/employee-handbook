import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // oly if lint passes locally
  },
  typescript: {
    ignoreBuildErrors: false, 
  },
  webpack: (config) => {
    config.ignoreWarnings = [
      { module: /@opentelemetry/ },
      { file: /node_modules\/@sentry/ }
    ];
    
    config.resolve.fallback = { 
      ...config.resolve.fallback,
      buffer: require.resolve('buffer/')
    };
    
    return config;
  },
  compiler: {
    styledComponents: true,
  }
};

export default nextConfig;

// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;
