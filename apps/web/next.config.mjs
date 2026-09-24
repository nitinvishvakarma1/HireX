/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Cloudscape ships untranspiled ESM/JSX in a few subpackages; let Next transpile them.
  transpilePackages: [
    "@hirex/shared",
    "@cloudscape-design/components",
    "@cloudscape-design/component-toolkit",
    "@cloudscape-design/global-styles",
  ],
};

export default nextConfig;
