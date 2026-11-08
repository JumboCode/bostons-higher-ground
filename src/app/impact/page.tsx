/* Public housing aggregates are loaded on the server; education remains an
 * explicitly labeled design preview until its public release is approved. */
import Link from "next/link";
import { ChartRenderer } from "@/components/charts";
import PeopleIcons from "@/components/PeopleIcons";
import {
    buildChartModel,
    type GeneratedChartModel,
} from "@/lib/chart-definitions";
import { getMockImpactData } from "@/lib/mock-impact-data";
import {
    getPublicImpactData,
    type PublicImpactData,
} from "@/lib/getPublicImpactData";

export const revalidate = 300;

function ChartCard({
    model,
    caption,
}: {
    model: GeneratedChartModel;
    caption: string;
}) {
    return (
        <figure className="min-w-0 rounded-lg bg-white p-6 shadow-sm">
            <h3 className="mb-1 text-lg font-semibold text-bhg-gray-300">
                {model.title}
            </h3>
            <figcaption className="mb-4 text-sm text-gray-600">
                {caption}
            </figcaption>
            <ChartRenderer model={model} />
        </figure>
    );
}

function HousedTotal({
    data,
    compact = false,
}: {
    data: PublicImpactData;
    compact?: boolean;
}) {
    const count = data.familiesHousedToDate;
    return (
        <section
            className={`rounded-lg p-6 ${compact ? "bg-bhg-mint-100" : "bg-white shadow-sm"}`}
        >
            <h2 className="text-lg font-semibold text-bhg-gray-300">
                Families housed to date
            </h2>
            <p className="my-2 text-5xl font-bold text-bhg-gray-300">
                {count === null ? "Not available" : count.toLocaleString()}
            </p>
            <p className="mb-4 text-sm text-gray-600">
                Families housed through Boston&apos;s Higher Ground.
            </p>
            {data.provisional && (
                <p className="mb-4 text-sm text-gray-600">
                    Provisional figure; historical starting figures have not yet
                    been confirmed.
                </p>
            )}
            {count !== null && !compact && (
                <PeopleIcons
                    count={count}
                    perIcon={Math.max(5, Math.ceil(count / 40 / 5) * 5)}
                    label="families housed"
                    className="text-bhg-mint-200"
                />
            )}
            {count === null && (
                <p className="text-sm text-gray-600">
                    This figure is not available for public reporting yet.
                </p>
            )}
        </section>
    );
}

function HousingTimeline({ data }: { data: PublicImpactData }) {
    if (!data.housingOverTime.length)
        return (
            <section className="rounded-lg bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-bhg-gray-300">
                    Families Housed Over Time
                </h2>
                <p className="mt-3 text-sm text-gray-600">
                    Housing-over-time figures are not available for public
                    reporting yet.
                </p>
            </section>
        );
    const unit = {
        month: "month",
        quarter: "quarter",
        year: "year",
        allTime: "reporting period",
    }[data.housingGranularity!];
    const model: GeneratedChartModel = {
        chartKey: "families-housed-line",
        type: "vertical-bar",
        title: "Families Housed Over Time",
        emptyMessage: "No housing outcomes recorded in this period.",
        xLabel: "Reporting period",
        yLabel: "Families",
        data: data.housingOverTime.map((point) => ({
            label: point.label,
            value: point.familiesHoused,
        })),
    };
    return (
        <div className="min-w-0">
            <ChartCard
                model={model}
                caption={`New families housed per ${unit}. Periods are grouped to protect families’ privacy. The current period may be partial; historical starting figures are included in the headline, not assigned to the timeline.`}
            />
            <details className="mt-3 rounded-lg bg-white p-4 text-sm text-gray-600">
                <summary className="cursor-pointer">
                    View housing data table
                </summary>
                <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-left">
                        <caption className="sr-only">
                            Recorded families housed by reporting period
                        </caption>
                        <thead>
                            <tr>
                                <th scope="col" className="p-2">
                                    Period
                                </th>
                                <th scope="col" className="p-2">
                                    Dates
                                </th>
                                <th scope="col" className="p-2">
                                    Families housed
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.housingOverTime.map((point) => (
                                <tr key={point.periodStart}>
                                    <th scope="row" className="p-2 font-normal">
                                        {point.label}
                                    </th>
                                    <td className="p-2">
                                        {point.periodStart} – {point.periodEnd}
                                    </td>
                                    <td className="p-2">
                                        {point.familiesHoused.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </details>
        </div>
    );
}

function EducationPreview() {
    const source = getMockImpactData();
    return (
        <section
            className="mt-10 border-t border-gray-300 pt-6"
            aria-labelledby="education-preview-title"
        >
            <h2
                id="education-preview-title"
                className="text-xl font-semibold text-bhg-gray-300"
            >
                Education preview
            </h2>
            <p className="mb-4 mt-2 text-sm text-gray-600">
                Sample data for the design preview. These are not reported
                program results.
            </p>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {(
                    [
                        "students-per-school-bar",
                        "grade-level-distribution-bar",
                    ] as const
                ).map((key) => (
                    <ChartCard
                        key={key}
                        model={buildChartModel(key, source, {
                            timeframe: "pastTwoYears",
                        })}
                        caption="Sample education data — design preview only."
                    />
                ))}
            </div>
        </section>
    );
}

function DesignA({ data }: { data: PublicImpactData }) {
    return (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <HousedTotal data={data} />
            <HousingTimeline data={data} />
        </div>
    );
}
function DesignB({ data }: { data: PublicImpactData }) {
    return (
        <div className="mx-auto max-w-3xl space-y-8">
            <HousedTotal data={data} />
            <HousingTimeline data={data} />
        </div>
    );
}
function DesignC({ data }: { data: PublicImpactData }) {
    return (
        <div className="space-y-4">
            <HousedTotal data={data} compact />
            <HousingTimeline data={data} />
        </div>
    );
}
const DESIGNS = { a: DesignA, b: DesignB, c: DesignC } as const;
type DesignKey = keyof typeof DESIGNS;

export default async function Impact({
    searchParams,
}: {
    searchParams: Promise<{ design?: string }>;
}) {
    const { design } = await searchParams;
    const key: DesignKey =
        design && Object.hasOwn(DESIGNS, design) ? (design as DesignKey) : "a";
    const Design = DESIGNS[key];
    let data: PublicImpactData | null = null;
    try {
        data = await getPublicImpactData();
    } catch {
        console.error("[public impact] Housing aggregate unavailable");
    }
    return (
        <main className="min-h-screen bg-[#F5F5F5] p-4 md:p-8">
            <nav
                className="mb-4 flex gap-2 text-sm"
                aria-label="Impact design preview"
            >
                {(Object.keys(DESIGNS) as DesignKey[]).map((d) => (
                    <Link
                        key={d}
                        href={`/impact?design=${d}`}
                        className={`rounded px-3 py-1 ${d === key ? "bg-bhg-gray-300 text-white" : "bg-white"}`}
                    >
                        Design {d.toUpperCase()}
                    </Link>
                ))}
            </nav>
            <h1 className="mb-6 text-2xl font-bold text-bhg-gray-300">
                Our Impact
            </h1>
            {data ? (
                <Design data={data} />
            ) : (
                <section className="rounded-lg bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-bhg-gray-300">
                        Housing data is temporarily unavailable
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Please check back later.
                    </p>
                </section>
            )}
            {data && (
                <p className="mt-6 text-xs text-gray-500">
                    Housing figures from Salesforce, as of {data.asOfDate}.
                    Families are counted once.
                </p>
            )}
            <EducationPreview />
        </main>
    );
}
