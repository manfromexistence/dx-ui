import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    const currentDate = new Date();
    const baseUrl = "https://kokonutui.com";

    // Base URLs
    const baseUrls: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: currentDate,
            changeFrequency: "yearly",
            priority: 1,
        },
        {
            url: `${baseUrl}/docs`,
            lastModified: currentDate,
            changeFrequency: "yearly",
            priority: 0.9,
        },
    ];

    // Component URLs
    const componentUrls: MetadataRoute.Sitemap = [
        "tweet-card",
        "dynamic-text",
        "swoosh-text",
        "type-writer",
        "card-stack",
        "toolbar",
        "v0-button",
        "attract-button",
        "social-button",
        "switch-button",
        "team-selector",
        "beams-background",
        "background-paths",
        "currency-transfer",
        "ai-input-search",
        "action-search-bar",
        "file-upload",
        "carousel-cards",
        "shimmer-text",
        "ai-text-loading",
        "shape-hero",
        "smooth-drawer",
        "card-flip",
        "command-button",
        "ai-prompt",
        "apple-activity-card",
        "ai-voice",
        "smooth-tab",
        "bento-grid",
        "hold-button",
        "gradient-button",
        "ai-loading",
        "avatar-picker",
        "sliced-text",
        "glitch-text",
        "matrix-text",
        "particle-button",
    ].map((component) => ({
        url: `${baseUrl}/docs/components/${component}`,
        lastModified: currentDate,
        changeFrequency: "monthly",
        priority: 0.5,
    }));

    return [...baseUrls, ...componentUrls];
}
