"use client";

import { useRouter } from "next/navigation";
import type { HousedBaselineSummary } from "@/lib/baselines";
import { useEffect, useState } from "react";
import DashboardTop from "@/components/DashboardTop";
import Chart from "@/components/chart";
import DashboardChart from "@/components/DashboardChart";
import useFilters, { type FilterState } from "@/lib/filterStore";
import formatTitle, { formattedFilters } from "@/lib/formatChartTitle";
import type { StoredChart } from "@/lib/generateChart";

export type FilterSummary = Pick<
    FilterState,
    | "selectedLocations"
    | "selectedSchools"
    | "timeframe"
    | "fiscalYear"
    | "customRange"
>;

export default function OverviewClient({ housedSummary }: { housedSummary: HousedBaselineSummary }) {
    const router = useRouter();
    useEffect(() => {
        const refresh = () => router.refresh();
        window.addEventListener("focus", refresh);
        return () => window.removeEventListener("focus", refresh);
    }, [router]);
    const [charts, setCharts] = useState<StoredChart[]>([]);
    const selectedLocations = useFilters((s) => s.selectedLocations);
    const selectedSchools = useFilters((s) => s.selectedSchools);
    const timeframe = useFilters((s) => s.timeframe);
    const fiscalYear = useFilters((s) => s.fiscalYear);
    const customRange = useFilters((s) => s.customRange);
    const filterState: FilterSummary = {
        selectedLocations,
        selectedSchools,
        timeframe,
        fiscalYear,
        customRange,
    };

    const [familyCountWaitTime, setFamilyCountWaitTime] = useState<{
        totalFamilies: number;
        averageWaitDays: number | null;
    } | null>(null);
    const filtersJson = JSON.stringify(filterState);

    useEffect(() => {
        const controller = new AbortController();
        fetch("/api/reports/family-count-wait-time", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filters: filtersJson }),
            signal: controller.signal,
        })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => data && setFamilyCountWaitTime(data))
            .catch(() => {});
        return () => controller.abort();
    }, [filtersJson]);

    const familyCountWaitTimeLabels = {
        totalFamilies: familyCountWaitTime ? familyCountWaitTime.totalFamilies.toLocaleString() : "…",
        averageWaitTime: !familyCountWaitTime
            ? "…"
            : familyCountWaitTime.averageWaitDays === null
              ? "N/A"
              : `${familyCountWaitTime.averageWaitDays} days`,
    };

    useEffect(() => {
        const fetchCharts = async () => {
            try {
                const res = await fetch("/api/reports/in-progress");
                if (!res.ok) return;
                const data = await res.json();
                setCharts(data.charts || []);
            } catch (err) {
                console.error("Failed to fetch in-progress charts", err);
            }
        };

        fetchCharts();

        window.addEventListener("report-updated", fetchCharts);
        return () => window.removeEventListener("report-updated", fetchCharts);
    }, []);

    return (
        <div className="w-full">
            <DashboardTop
                pageTitle="Overview"
                title="Total Families Enrolled"
                body={familyCountWaitTimeLabels.totalFamilies}
                subtext="Selected report filters"
                bgColor="bg-[#E0F7F4]"
                title1="Families Housed to Date"
                title2="Average Wait Time"
                bgColor1="bg-[#F0E7ED]"
                bgColor2="bg-[#FFF8E9]"
                body1={housedSummary.total?.toLocaleString() ?? "Not set"}
                body2={familyCountWaitTimeLabels.averageWaitTime}
                subtext1={housedSummary.baseline ? `${housedSummary.provisional ? "Provisional · " : ""}${housedSummary.baseline.startingValue.toLocaleString()} historical + ${housedSummary.additions?.toLocaleString()} since ${housedSummary.baseline.asOfDate} · All families` : "Historical baseline not set"}
                subtext2="Intake to housed"
                mt="-mt-[10px]"
            />
            <div className="grid grid-cols-1 items-start gap-8 p-10 lg:grid-cols-2">
                <Chart
                    title = {formatTitle(filterState, "Family Intake Over Time")}
                    chartType="family-intake-bar"
                    reportCharts={charts}
                    appliedFilters={formattedFilters(filterState)}
                    filterState={filterState}
                >
                    <DashboardChart chartKey="family-intake-bar" filters={filterState} />
                </Chart>

                <Chart
                    title={formatTitle(filterState, "Families Housed Over Time")}
                    chartType="families-housed-line"
                    reportCharts={charts}
                    appliedFilters={formattedFilters(filterState)}
                    filterState={filterState}
                >
                    <DashboardChart chartKey="families-housed-line" filters={filterState} />
                </Chart>

                <Chart
                    title={formatTitle(filterState, "Days to House Distribution")}
                    chartType="days-to-house-bar"
                    reportCharts={charts}
                    appliedFilters={formattedFilters(filterState)}
                    filterState={filterState}
                >
                    <DashboardChart chartKey="days-to-house-bar" filters={filterState} />
                </Chart>
            </div>
        </div>
    );
}
