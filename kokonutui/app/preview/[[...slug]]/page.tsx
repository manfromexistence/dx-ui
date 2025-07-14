import { notFound } from "next/navigation";
import dynamic from "next/dynamic";

// Arrays to categorize components
const CENTERED_COMPONENTS = [
    "liquid-glass-card",
    "action-search-bar",
    "apple-activity-card",
    "bento-grid",
    "card-flip",
    "card-stack",
    "file-upload",
    "toolbar",
    "ai-prompt",
    "ai-voice",
    "typewriter",
    "v0-button"
    // Add more small components here
];

// const FULL_WIDTH_COMPONENTS = ["hero"];

export default async function PreviewPage({
    params,
}: {
    params: Promise<{ slug: string[] }>;
}) {
    const { slug } = await params;
    if (!slug.length) return notFound();

    const componentName = slug.join("/");

    try {
        const Component = dynamic(
            () =>
                import(`@/components/kokonutui/${componentName}`).catch(() =>
                    notFound()
                ),
            { ssr: true }
        );

        // Check if component should be centered
        const shouldCenter = CENTERED_COMPONENTS.some((component) =>
            componentName.startsWith(component)
        );

        return shouldCenter ? (
            <div className="min-h-screen flex items-center justify-center">
                <Component />
            </div>
        ) : (
            <Component />
        );
    } catch (error) {
        return notFound();
    }
}
