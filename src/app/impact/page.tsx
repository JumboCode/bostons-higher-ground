/*
    Author: Alex Vu
    Date: 10/23/26

    Purpose: public-facing summary of BHG's impact. Charts are built here on
    the server; the browser only receives finished aggregate models.
*/

import Link from "next/link";

import { ChartRenderer } from "@/components/charts";
import PeopleIcons from "@/components/PeopleIcons";
import {
    buildChartModel,
    type ChartKey,
    type GeneratedChartModel,
} from "@/lib/chart-definitions";
import { getMockImpactData } from "@/lib/mock-impact-data";

// ISR: rebuild at most hourly. Note: reading searchParams (design picker below)
// makes the route dynamic; once BHG picks a design, drop the param and ISR applies.
export const revalidate = 3600;

// ponytail: placeholder counts, swap for a real query later
const NEED = { count: 97, label: "Families in need of housing" };
const RESPONSE = { count: 81, label: "Families housed through Boston's Higher Ground" };

const CHARTS: { key: ChartKey; caption: string }[] = [
    { key: "families-housed-line", caption: "Families moving into stable housing each month." },
    { key: "students-per-school-bar", caption: "Students we support at each partner school." },
    { key: "grade-level-distribution-bar", caption: "Students we support, by grade." },
    // { key: "attendance-breakdown-donut", caption: "How often our students make it to class." },
];

function getModels() {
    // ponytail: mock data; swap for getAllData()/getEducationData() after design sign-off.
    // Group-size suppression already runs inside buildChartModel.
    const source = getMockImpactData();
    return CHARTS.map(({ key, caption }) => ({
        caption,
        model: buildChartModel(key, source, { timeframe: "pastTwoYears" }),
    }));
}

type ChartItem = ReturnType<typeof getModels>[number];

function totalStudents(items: ChartItem[]) {
    const m = items.find((i) => i.model.chartKey === "students-per-school-bar")?.model;
    if (m?.type !== "horizontal-bar") return 0;
    return m.data.reduce((sum, d) => sum + d.series[0].value, 0);
}

function Panel({ title, count, label, className }: { title: string; count: number; label: string; className: string }) {
    return (
        <section className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-bhg-gray-300">{title}</h2>
            <p className="my-2 text-5xl font-bold text-bhg-gray-300">{count}</p>
            <p className="mb-4 text-sm text-bhg-gray-300">{label}</p>
            <PeopleIcons count={count} label={label} className={className} />
        </section>
    );
}

function ChartCard({ model, caption }: { model: GeneratedChartModel; caption?: string }) {
    return (
        <figure className="min-w-0 rounded-lg bg-white p-6 shadow-sm">
            <h3 className="mb-1 text-lg font-semibold text-bhg-gray-300">{model.title}</h3>
            {caption && <figcaption className="mb-4 text-sm text-gray-600">{caption}</figcaption>}
            <ChartRenderer model={model} />
        </figure>
    );
}

function Stat({ value, label, className }: { value: string; label: string; className: string }) {
    return (
        <div className={`rounded-lg p-4 ${className}`}>
            <p className="text-3xl font-bold text-bhg-gray-300">{value}</p>
            <p className="text-sm text-bhg-gray-300">{label}</p>
        </div>
    );
}

// // A: current panels + chart grid
// function DesignA({ items }: { items: ChartItem[] }) {
//     return (
//         <>
//             <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//                 <Panel title="Need" {...NEED} className="text-bhg-pink" />
//                 <Panel title="Response" {...RESPONSE} className="text-bhg-mint-200" />
//             </div>
//             <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
//                 {items.map(({ model }) => (
//                     <ChartCard key={model.chartKey} model={model} />
//                 ))}
//             </div>
//         </>
//     );
// }

// B: story scroll, one idea per section
function DesignB({ items }: { items: ChartItem[] }) {
    return (
        <div className="mx-auto max-w-3xl space-y-12">
            <section className="text-center">
                <p className="text-6xl font-bold text-bhg-pink">{RESPONSE.count}</p>
                <p className="mt-2 text-lg text-bhg-gray-300">
                    families housed, out of {NEED.count} who came to us in need.
                </p>
            </section>
            {items.map(({ model, caption }) => (
                <ChartCard key={model.chartKey} model={model} caption={caption} />
            ))}
        </div>
    );
}

// C: compact, sized for an iframe embed on BHG's site
function DesignC({ items }: { items: ChartItem[] }) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Stat value={String(NEED.count)} label="Families in need" className="bg-bhg-pink-100" />
                <Stat value={String(RESPONSE.count)} label="Families housed" className="bg-bhg-mint-100" />
                <Stat value={totalStudents(items).toLocaleString()} label="Students supported" className="bg-bhg-yellow-100" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {items.slice(0, 2).map(({ model }) => (
                    <ChartCard key={model.chartKey} model={model} />
                ))}
            </div>
        </div>
    );
}

const DESIGNS = { b: DesignB } as const;
type DesignKey = keyof typeof DESIGNS;

export default async function Impact({
    searchParams,
}: {
    searchParams: Promise<{ design?: string }>;
}) {
    const { design } = await searchParams;
    const key: DesignKey = design && design in DESIGNS ? (design as DesignKey) : "b";
    const Design = DESIGNS[key];

    return (
        <main className="min-h-screen bg-[#F5F5F5] p-4 md:p-8">
            {/* ponytail: wireframe-only design switcher; delete once BHG picks one */}
            <nav className="mb-4 flex gap-2 text-sm">
                {/* {(Object.keys(DESIGNS) as DesignKey[]).map((d) => (
                    <Link
                        key={d}
                        href={`/impact?design=${d}`}
                        className={`rounded px-3 py-1 ${d === key ? "bg-bhg-gray-300 text-white" : "bg-white"}`}
                    >
                        Design {d.toUpperCase()}
                    </Link>
                ))} */}
            </nav>
            <h1 className="mb-6 text-2xl font-bold text-bhg-gray-300">Our Impact</h1>
            <Design items={getModels()} />
            <p className="mt-8 text-xs text-gray-500">
                Sample data.
            </p>
        </main>
    );
}
