import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import Module, { createRequire } from "node:module";
import { renderToStaticMarkup } from "react-dom/server";
Object.assign(globalThis, { React });
const load = createRequire(import.meta.url);
const loader = Module as unknown as {
    _load: (id: string, ...args: unknown[]) => unknown;
};
const original = loader._load;
const wrapper = ({ children }: { children?: React.ReactNode }) => (
    <svg>{children}</svg>
);
const empty = () => null;
loader._load = function (id, ...args) {
    if (id === "recharts")
        return {
            BarChart: wrapper,
            Bar: ({ fill }: { fill: string }) => <path fill={fill} />,
            CartesianGrid: empty,
            XAxis: empty,
            YAxis: empty,
            Label: empty,
            Legend: empty,
        };
    if (id === "@/components/ui/chart")
        return {
            ChartContainer: wrapper,
            ChartTooltip: empty,
            ChartTooltipContent: empty,
            ChartLegend: empty,
            ChartLegendContent: empty,
        };
    return original.call(this, id, ...args);
};
const { VerticalBarChart } = load(
    "../src/components/charts/vertical-bar-chart"
) as typeof import("../src/components/charts/vertical-bar-chart");
const { HorizontalBarChart } = load(
    "../src/components/charts/horizontal-bar-chart"
) as typeof import("../src/components/charts/horizontal-bar-chart");
loader._load = original;
test("vertical bars paint the requested color without CSS variable fills", () => {
    const vertical = renderToStaticMarkup(
        <VerticalBarChart
            data={[{ label: "2025", value: 10 }]}
            barColor="#123456"
        />
    );
    assert.match(vertical, /fill="#123456"/);
});
test("horizontal bars paint a series color without CSS variable fills", () => {
    const horizontal = renderToStaticMarkup(
        <HorizontalBarChart
            data={[
                {
                    category: "Boston",
                    series: [{ label: "Families", value: 10 }],
                },
            ]}
        />
    );
    assert.doesNotMatch(horizontal, /fill="var\(/);
    assert.match(horizontal, /fill="#[a-fA-F0-9]+"/);
});
