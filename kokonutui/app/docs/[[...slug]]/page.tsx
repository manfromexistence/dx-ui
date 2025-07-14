import { source } from "@/lib/source";
import {
    DocsPage,
    DocsBody,
    DocsTitle,
    DocsDescription,
} from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import defaultMdxComponents from "fumadocs-ui/mdx";
import { Preview } from "@/components/mdx/preview";
import { PreviewClient } from "@/components/mdx/preview-client";
import PreviewTemplate from "@/components/mdx/preview-template";
import WhatIncluded from "@/components/mdx/what-included";

export default async function Page(props: {
    params: Promise<{ slug?: string[] }>;
}) {
    const params = await props.params;
    const page = source.getPage(params.slug);
    if (!page) notFound();

    const MDX = page.data.body;

    return (
        <DocsPage
            footer={{ enabled: false }}
            toc={page.data.toc}
            full={page.data.full}
        >
            <div className="absolute top-24 right-72 flex items-center gap-3"></div>
            <DocsTitle>{page.data.title}</DocsTitle>
            <DocsDescription>{page.data.description}</DocsDescription>
            <DocsBody>
                <MDX
                    components={{
                        ...defaultMdxComponents,
                        Preview,
                        PreviewClient,
                        PreviewTemplate,
                        WhatIncluded,
                    }}
                />
            </DocsBody>
        </DocsPage>
    );
}

export async function generateStaticParams() {
    return source.generateParams();
}

export async function generateMetadata(props: {
    params: Promise<{ slug?: string[] }>;
}) {
    const params = await props.params;
    const page = source.getPage(params.slug);
    if (!page) notFound();

    return {
        title: page.data.title,
        description: page.data.description,
    };
}
