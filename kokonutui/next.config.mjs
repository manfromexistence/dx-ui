import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

const nextConfig = {
    pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
    outputFileTracingIncludes: {
        "/**": ["components/kokonutui/**/*"],
    },
    async headers() {
        return [
            {
                source: "/r/:path*",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "public, max-age=31536000, immutable",
                    },
                ],
            },
            {
                source: "/_next/image",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "public, max-age=86400, immutable",
                    },
                ],
            },
        ];
    },
    images: {
        remotePatterns: [
            {
                hostname: "*",
            },
        ],
        minimumCacheTTL: 2678400,
    },
    reactStrictMode: true,
    serverExternalPackages: ["twoslash", "typescript"],
};

export default withMDX(nextConfig);
