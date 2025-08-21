/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['tesseract.js'],
  images: {
    domains: ['localhost']
  }
}

module.exports = nextConfig
