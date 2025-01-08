const { SERVICENOW_INSTANCE } = require('./servicenow.config')

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `${SERVICENOW_INSTANCE}/api/:path*`,
            },
        ]
    },
}

module.exports = nextConfig

