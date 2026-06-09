export type VerticalBarDatum = { label: string; value: number };

export type LineDatum = { label: string; value: number };

export type HorizontalSeriesDatum = {
    label: string;
    value: number;
    color?: string;
};

export type HorizontalBarDatum = {
    category: string;
    series: HorizontalSeriesDatum[];
};

export type DonutDatum = { label: string; value: number; color?: string };

export type ChartKind = "vertical-bar" | "horizontal-bar" | "line" | "donut";
