"use client";

import { useEffect, useState } from "react";

import { ChartRenderer } from "@/components/charts";
import type {
    ChartFilters,
    ChartKey,
    GeneratedChartModel,
} from "@/lib/chart-definitions";

function hasChartData(model: GeneratedChartModel) {
    switch (model.type) {
        case "vertical-bar":
        case "line":
            return model.data.some((datum) => datum.value > 0);
        case "horizontal-bar":
            return model.data.some((datum) =>
                datum.series.some((series) => series.value > 0)
            );
        case "donut":
            return model.data.some((datum) => datum.value > 0);
    }
}

// Charts are built server-side (/api/reports/chart-preview) so raw rows never reach the browser.
export default function DashboardChart({
    chartKey,
    filters,
}: {
    chartKey: ChartKey;
    filters?: Partial<ChartFilters>;
}) {
    const [model, setModel] = useState<GeneratedChartModel | null>(null);
    const [failed, setFailed] = useState(false);
    // Stable dependency: filter objects are rebuilt every render by callers.
    const filtersJson = JSON.stringify(filters ?? {});

    useEffect(() => {
        const controller = new AbortController();
        setFailed(false);

        fetch("/api/reports/chart-preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: chartKey,
                chartType: chartKey,
                filters: filtersJson,
            }),
            signal: controller.signal,
        })
            .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
            .then((payload: { model?: GeneratedChartModel }) =>
                setModel(payload.model ?? null)
            )
            .catch(() => {
                if (!controller.signal.aborted) setFailed(true);
            });

        return () => controller.abort();
    }, [chartKey, filtersJson]);

    if (!model) {
        return (
            <div className="flex h-64 items-center justify-center text-gray-500">
                {failed ? "Couldn't load chart." : "Loading…"}
            </div>
        );
    }

    return (
        <div className="relative">
            <ChartRenderer model={model} />
            {!hasChartData(model) && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60 pl-8">
                    <p className="text-lg font-semibold text-gray-600">
                        {model.emptyMessage}
                    </p>
                </div>
            )}
        </div>
    );
}
