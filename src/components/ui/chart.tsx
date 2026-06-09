"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = {
    [key: string]: {
        label?: React.ReactNode;
        color?: string;
        theme?: Record<keyof typeof THEMES, string>;
    };
};

type ChartContextProps = {
    config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
    const context = React.useContext(ChartContext);

    if (!context) {
        throw new Error("useChart must be used within a <ChartContainer />");
    }

    return context;
}

export function ChartContainer({
    id,
    className,
    children,
    config,
    ...props
}: React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<
        typeof RechartsPrimitive.ResponsiveContainer
    >["children"];
}) {
    const uniqueId = React.useId();
    const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

    return (
        <ChartContext.Provider value={{ config }}>
            <div
                data-chart={chartId}
                className={cn(
                    "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
                    className
                )}
                {...props}
            >
                <ChartStyle id={chartId} config={config} />
                <RechartsPrimitive.ResponsiveContainer>
                    {children}
                </RechartsPrimitive.ResponsiveContainer>
            </div>
        </ChartContext.Provider>
    );
}

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
    const colorConfig = Object.entries(config).filter(
        ([, itemConfig]) => itemConfig.theme || itemConfig.color
    );

    if (!colorConfig.length) return null;

    return (
        <style
            dangerouslySetInnerHTML={{
                __html: Object.entries(THEMES)
                    .map(
                        ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
    .map(([key, itemConfig]) => {
        const color =
            itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
            itemConfig.color;
        return color ? `  --color-${key}: ${color};` : null;
    })
    .filter(Boolean)
    .join("\n")}
}
`
                    )
                    .join("\n"),
            }}
        />
    );
}

type ChartPayloadItem = {
    dataKey?: string | number;
    name?: string | number;
    value?: React.ReactNode;
    color?: string;
    fill?: string;
    payload?: Record<string, unknown>;
};

function getPayloadConfigFromPayload(
    config: ChartConfig,
    payload: ChartPayloadItem,
    key: string
) {
    if (typeof payload.payload === "object" && payload.payload !== null) {
        const payloadConfig = payload.payload[key];

        if (
            typeof payloadConfig === "string" &&
            payloadConfig in config
        ) {
            return config[payloadConfig];
        }
    }

    if (key in config) {
        return config[key];
    }

    return undefined;
}

export const ChartTooltip = RechartsPrimitive.Tooltip;

export function ChartTooltipContent({
    active,
    payload,
    className,
    label,
    hideLabel = false,
    hideIndicator = false,
    nameKey,
}: {
    active?: boolean;
    payload?: ChartPayloadItem[];
    className?: string;
    label?: React.ReactNode;
    hideLabel?: boolean;
    hideIndicator?: boolean;
    nameKey?: string;
}) {
    const { config } = useChart();

    if (!active || !payload?.length) return null;

    return (
        <div
            className={cn(
                "grid min-w-32 items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
                className
            )}
        >
            {!hideLabel && label ? (
                <div className="font-medium text-foreground">{label}</div>
            ) : null}
            <div className="grid gap-1.5">
                {payload.map((item, index) => {
                    const key = `${nameKey || item.name || item.dataKey || "value"}`;
                    const itemConfig = getPayloadConfigFromPayload(config, item, key);
                    const indicatorColor = item.color || item.fill;

                    return (
                        <div
                            key={`${key}-${index}`}
                            className="flex min-w-0 items-center gap-2"
                        >
                            {!hideIndicator && (
                                <span
                                    className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                                    style={{ backgroundColor: indicatorColor }}
                                />
                            )}
                            <div className="flex flex-1 justify-between gap-4 leading-none">
                                <span className="text-muted-foreground">
                                    {itemConfig?.label || key}
                                </span>
                                <span className="font-mono font-medium tabular-nums text-foreground">
                                    {item.value}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export const ChartLegend = RechartsPrimitive.Legend;

export function ChartLegendContent({
    payload,
    className,
    nameKey,
}: {
    payload?: ChartPayloadItem[];
    className?: string;
    nameKey?: string;
}) {
    const { config } = useChart();

    if (!payload?.length) return null;

    return (
        <div className={cn("flex flex-wrap items-center justify-center gap-4", className)}>
            {payload.map((item, index) => {
                const key = `${nameKey || item.dataKey || item.name || "value"}`;
                const itemConfig = getPayloadConfigFromPayload(config, item, key);

                return (
                    <div
                        key={`${key}-${index}`}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground"
                    >
                        <span
                            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                            style={{ backgroundColor: item.color || item.fill }}
                        />
                        {itemConfig?.label || key}
                    </div>
                );
            })}
        </div>
    );
}
