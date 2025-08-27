/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Ignore test files from pdf-parse and other packages during build
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/test$/,
        contextRegExp: /pdf-parse$/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /\.pdf$/,
        contextRegExp: /pdf-parse[\\/]test/,
      })
    )
    return config
  }
}

module.exports = nextConfig
