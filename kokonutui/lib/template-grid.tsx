import { CheckCheck } from "lucide-react";

interface ListItem {
    id: string;
    text: string;
    subtext?: string;
}

interface ColumnData {
    title: string;
    items: ListItem[];
}

interface TemplateData {
    columnOneData: ColumnData;
    columnTwoData: ColumnData;
    technologies: ColumnData;
}

const data: Record<string, TemplateData> = {
    "startup-template": {
        columnOneData: {
            title: "Features",
            items: [
                { id: "feature-1", text: "1-click download and setup" },
                { id: "feature-2", text: "SEO Ready" },
                { id: "feature-3", text: "Small animations and details" },
                { id: "feature-4", text: "Responsive Design" },
                { id: "feature-5", text: "Dark and Light mode" },
                { id: "feature-6", text: "Modern and Elegant Design" },
                { id: "feature-7", text: "Easy to customize" },
            ],
        },
        columnTwoData: {
            title: "Pages",
            items: [
                { id: "benefit-1", text: "Header" },
                { id: "benefit-2", text: "Hero" },
                { id: "benefit-3", text: "Features Grid" },
                { id: "benefit-4", text: "Pricing" },
                { id: "benefit-5", text: "FAQ" },
                { id: "benefit-6", text: "Footer" },
                { id: "benefit-7", text: "404 Page" },
            ],
        },
        technologies: {
            title: "Technologies",
            items: [
                { id: "technology-1", text: "Next.js", subtext: "v15.2.2" },
                {
                    id: "technology-2",
                    text: "Tailwind CSS",
                    subtext: "v4.11.0",
                },
                { id: "technology-3", text: "TypeScript", subtext: "v5" },
                { id: "technology-4", text: "shadcn/ui", subtext: "" },
                { id: "technology-5", text: "React", subtext: "v19" },
                { id: "technology-6", text: "next-themes", subtext: "v0.4.1" },
                { id: "technology-7", text: "Motion", subtext: "v13" },
            ],
        },
    },
    "saas-template": {
        columnOneData: {
            title: "Features",
            items: [
                { id: "feature-1", text: "1-click download and setup" },
                { id: "feature-2", text: "SEO Ready" },
                { id: "feature-3", text: "Small animations and details" },
                { id: "feature-4", text: "Responsive Design" },
                { id: "feature-5", text: "Dark and Light mode" },
                { id: "feature-6", text: "Modern and Elegant Design" },
                { id: "feature-7", text: "Easy to customize" },
            ],
        },
        columnTwoData: {
            title: "Pages",
            items: [
                { id: "benefit-0", text: "Sign in / Sign up" },
                { id: "benefit-1", text: "Header" },
                { id: "benefit-2", text: "Hero" },
                { id: "benefit-3", text: "Features Grid" },
                { id: "benefit-4", text: "Testimonials" },
                { id: "benefit-5", text: "Pricing" },
                { id: "benefit-6", text: "FAQ" },
                { id: "benefit-7", text: "Footer" },
                { id: "benefit-8", text: "404 Page" },
            ],
        },
        technologies: {
            title: "Technologies",
            items: [
                { id: "technology-1", text: "Next.js", subtext: "v15.2.2" },
                {
                    id: "technology-2",
                    text: "Tailwind CSS",
                    subtext: "v4.0.0",
                },
                { id: "technology-3", text: "TypeScript", subtext: "v5" },
                { id: "technology-4", text: "shadcn/ui", subtext: "" },
                { id: "technology-5", text: "React", subtext: "v19" },
                { id: "technology-6", text: "next-themes", subtext: "v0.4.1" },
                { id: "technology-7", text: "Motion", subtext: "v13" },
            ],
        },
    },
    "saas-plus-template": {
        columnOneData: {
            title: "Features",
            items: [
                { id: "feature-1", text: "1-click download and setup" },
                { id: "feature-2", text: "SEO Ready" },
                { id: "feature-3", text: "Small animations and details" },
                { id: "feature-4", text: "Responsive Design" },
                { id: "feature-5", text: "Dark and Light mode" },
                { id: "feature-6", text: "Modern and Elegant Design" },
                { id: "feature-7", text: "Easy to customize" },
            ],
        },
        columnTwoData: {
            title: "Pages",
            items: [
                { id: "benefit-1", text: "Header" },
                { id: "benefit-2", text: "Hero" },
                { id: "benefit-3", text: "Two Features Grid" },
                { id: "benefit-4", text: "Testimonials" },
                { id: "benefit-5", text: "Pricing" },
                { id: "benefit-7", text: "Footer" },
                { id: "benefit-8", text: "404 Page" },
            ],
        },
        technologies: {
            title: "Technologies",
            items: [
                { id: "technology-1", text: "Next.js", subtext: "v15.2.2" },
                { id: "technology-2", text: "Tailwind CSS", subtext: "v4.0.0" },
                { id: "technology-3", text: "TypeScript", subtext: "v5" },
                { id: "technology-4", text: "shadcn/ui", subtext: "" },
                { id: "technology-5", text: "React", subtext: "v19" },
                { id: "technology-6", text: "next-themes", subtext: "v0.4.1" },
                { id: "technology-7", text: "Motion", subtext: "v13" },
            ],
        },
    },
    "designer-template": {
        columnOneData: {
            title: "Features",
            items: [
                { id: "feature-1", text: "1-click download and setup" },
                { id: "feature-8", text: "Images assets included" },
                { id: "feature-2", text: "SEO Ready" },
                { id: "feature-3", text: "Small animations and details" },
                { id: "feature-4", text: "Responsive Design" },
                { id: "feature-5", text: "Dark and Light mode" },
                { id: "feature-6", text: "Modern and Elegant Design" },
                { id: "feature-7", text: "Easy to customize" },
            ],
        },
        columnTwoData: {
            title: "Pages",
            items: [
                { id: "benefit-1", text: "Header" },
                { id: "benefit-2", text: "Hero" },
                { id: "benefit-3", text: "Features Grid" },
                { id: "benefit-4", text: "Testimonials" },
                { id: "benefit-5", text: "Pricing" },
                { id: "benefit-6", text: "FAQ" },
                { id: "benefit-7", text: "Footer" },
                { id: "benefit-8", text: "404 Page" },
            ],
        },
        technologies: {
            title: "Technologies",
            items: [
                { id: "technology-1", text: "Next.js", subtext: "v15.2.2" },
                { id: "technology-2", text: "Tailwind CSS", subtext: "v4.0.0" },
                { id: "technology-3", text: "TypeScript", subtext: "v5" },
                { id: "technology-4", text: "shadcn/ui", subtext: "" },
                { id: "technology-5", text: "React", subtext: "v19" },
                { id: "technology-6", text: "next-themes", subtext: "v0.4.1" },
                { id: "technology-7", text: "Motion", subtext: "v13" },
            ],
        },
    },
    "dashboard-template": {
        columnOneData: {
            title: "Features",
            items: [
                { id: "feature-1", text: "1-click download and setup" },
                { id: "feature-2", text: "SEO Ready" },
                { id: "feature-3", text: "Animations and Charts" },
                { id: "feature-4", text: "Responsive for Mobile" },
                { id: "feature-5", text: "Dark and Light mode" },
                { id: "feature-6", text: "Modern and Elegant Design" },
                { id: "feature-7", text: "Easy to customize" },
                { id: "feature-8", text: "Assets included" },
            ],
        },
        columnTwoData: {
            title: "Pages",
            items: [
                { id: "benefit-1", text: "Navbar" },
                { id: "benefit-2", text: "Sidebar" },
                { id: "benefit-3", text: "Dashboard" },
                { id: "benefit-4", text: "Settings" },
                { id: "benefit-5", text: "Profile" },
                { id: "benefit-6", text: "404 Page" },
            ],
        },
        technologies: {
            title: "Technologies",
            items: [
                { id: "technology-1", text: "Next.js", subtext: "v15.2.2" },
                { id: "technology-2", text: "Tailwind CSS", subtext: "v4.0.0" },
                { id: "technology-3", text: "TypeScript", subtext: "v5" },
                { id: "technology-4", text: "shadcn/ui", subtext: "" },
                { id: "technology-5", text: "React", subtext: "v19" },
                { id: "technology-6", text: "next-themes", subtext: "v0.4.1" },
                { id: "technology-7", text: "Motion", subtext: "v13" },
            ],
        },
    },
    "blog-template": {
        columnOneData: {
            title: "Features",
            items: [
                { id: "feature-1", text: "1-click download and setup" },
                { id: "feature-2", text: "Markdown Posts" },
                { id: "feature-3", text: "SEO Ready" },
                { id: "feature-4", text: "Responsive Design" },
                { id: "feature-5", text: "Dark and Light mode" },
                { id: "feature-6", text: "Minimalist Design" },
                { id: "feature-7", text: "Easy to customize" },
            ],
        },
        columnTwoData: {
            title: "Pages",
            items: [
                { id: "benefit-1", text: "Articles" },
                { id: "benefit-2", text: "Categories" },
                { id: "benefit-3", text: "Tags" },
                { id: "benefit-4", text: "404 Page" },
            ],
        },
        technologies: {
            title: "Technologies",
            items: [
                { id: "technology-1", text: "Next.js", subtext: "v15.2.2" },
                { id: "technology-2", text: "Tailwind CSS", subtext: "v4.0.0" },
                { id: "technology-3", text: "TypeScript", subtext: "v5" },
                { id: "technology-5", text: "React", subtext: "v19" },
                { id: "technology-6", text: "next-themes", subtext: "v0.4.1" },
            ],
        },
    },
};

const ListWithIcon = ({ items }: { items: ListItem[] }) => (
    <ul className="ml-0 pl-0">
        {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2">
                <CheckCheck className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
                <span className="text-zinc-900 dark:text-zinc-200 text-sm">
                    {item.text}
                </span>
                {item.subtext && (
                    <span className="text-zinc-500 dark:text-zinc-400 text-xs">
                        {item.subtext}
                    </span>
                )}
            </li>
        ))}
    </ul>
);

export default function TemplateGrid({ template }: { template: string }) {
    const templateData = data[template];
    if (!templateData) return null;

    const { columnOneData, columnTwoData, technologies } = templateData;

    // Split technologies items into chunks of 4
    const techColumns = [];
    for (let i = 0; i < technologies.items.length; i += 4) {
        techColumns.push(technologies.items.slice(i, i + 4));
    }

    return (
        <div className="">
            {/* Two Column Grid */}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 mb-16">
                {/* Column One */}
                <div className="rounded-lg">
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        {columnOneData.title}
                    </h2>
                    <ListWithIcon items={columnOneData.items} />
                </div>

                {/* Column Two */}
                <div className="rounded-lg">
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                        {columnTwoData.title}
                    </h2>
                    <ListWithIcon items={columnTwoData.items} />
                </div>
            </div>

            {/* Technologies Grid */}
            <div className="mb-12">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-4">
                    {technologies.title}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {techColumns.map((column) => (
                        <div
                            key={column.map((item) => item.id).join("-")}
                            className="rounded-lg"
                        >
                            <ListWithIcon items={column} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
