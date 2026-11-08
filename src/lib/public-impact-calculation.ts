import {
    calculateHousedTotal,
    type BaselineValue,
} from "./baseline-calculation";
import { canonicalFamilies } from "./family-metrics";
import { MIN_GROUP_SIZE } from "./chart-definitions";

export type HousingGranularity = "month" | "quarter" | "year" | "allTime";
export type PublicHousingPeriod = {
    periodStart: string;
    periodEnd: string;
    label: string;
    familiesHoused: number;
};
export type PublicImpactData = {
    familiesHousedToDate: number | null;
    housingOverTime: PublicHousingPeriod[];
    housingGranularity: HousingGranularity | null;
    asOfDate: string;
    minimumGroupSize: number;
    provisional: boolean;
};
type ImpactRecord = {
    familyId: string;
    intakeDate: string | null;
    dateHoused: string | null;
};
const iso = (date: Date) => date.toISOString().slice(0, 10);

function periodStart(
    date: string,
    granularity: Exclude<HousingGranularity, "allTime">
) {
    const result = new Date(`${date}T00:00:00Z`);
    result.setUTCDate(1);
    if (granularity === "quarter")
        result.setUTCMonth(Math.floor(result.getUTCMonth() / 3) * 3);
    if (granularity === "year") result.setUTCMonth(0);
    return result;
}

function periods(
    dates: string[],
    start: string,
    end: string,
    granularity: HousingGranularity
): PublicHousingPeriod[] {
    if (granularity === "allTime")
        return [
            {
                periodStart: start,
                periodEnd: end,
                label:
                    start.slice(0, 4) === end.slice(0, 4)
                        ? start.slice(0, 4)
                        : `${start.slice(0, 4)}–${end.slice(0, 4)}`,
                familiesHoused: dates.length,
            },
        ];
    const counts = new Map<string, number>();
    for (const date of dates) {
        const key = iso(periodStart(date, granularity));
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const result: PublicHousingPeriod[] = [];
    let cursor = periodStart(start, granularity);
    const months =
        granularity === "month" ? 1 : granularity === "quarter" ? 3 : 12;
    while (iso(cursor) <= end) {
        const key = iso(cursor);
        const next = new Date(cursor);
        next.setUTCMonth(next.getUTCMonth() + months);
        const final = iso(new Date(next.getTime() - 86_400_000));
        const label =
            granularity === "month"
                ? new Intl.DateTimeFormat("en-US", {
                      month: "short",
                      year: "numeric",
                      timeZone: "UTC",
                  }).format(cursor)
                : granularity === "quarter"
                  ? `Q${Math.floor(cursor.getUTCMonth() / 3) + 1} ${cursor.getUTCFullYear()}`
                  : String(cursor.getUTCFullYear());
        result.push({
            periodStart: key < start ? start : key,
            periodEnd: final > end ? end : final,
            label,
            familiesHoused: counts.get(key) ?? 0,
        });
        cursor = next;
    }
    return result;
}

/** One fixed, unfiltered release. Coarsen the entire series uniformly until
 * every nonzero group is >= k; never send suppressed finer buckets alongside
 * their total. Historical baseline families receive no invented housing dates.
 */
export function buildPublicImpactData(
    records: ImpactRecord[],
    baseline: BaselineValue | null,
    provisional: boolean,
    today: string
): PublicImpactData {
    const result: PublicImpactData = {
        familiesHousedToDate: null,
        housingOverTime: [],
        housingGranularity: null,
        asOfDate: today,
        minimumGroupSize: MIN_GROUP_SIZE,
        provisional,
    };
    if (!baseline) return result;
    const { additions, total } = calculateHousedTotal(records, baseline, today);
    const small = (n: number) => n > 0 && n < MIN_GROUP_SIZE;
    // Also protect small baseline/additions populations from total-minus-series
    // or total-minus-known-baseline inference.
    result.familiesHousedToDate =
        small(total) || small(baseline.startingValue) || small(additions)
            ? null
            : total;
    if (small(additions)) return result;
    const first = new Date(`${baseline.asOfDate}T00:00:00Z`);
    first.setUTCDate(first.getUTCDate() + 1);
    const start = iso(first);
    if (start > today) return result;
    const dates = canonicalFamilies(records).flatMap((row) =>
        row.dateHoused && row.dateHoused >= start && row.dateHoused <= today
            ? [row.dateHoused]
            : []
    );
    for (const granularity of [
        "month",
        "quarter",
        "year",
        "allTime",
    ] as const) {
        const series = periods(dates, start, today, granularity);
        if (series.every((point) => !small(point.familiesHoused))) {
            result.housingOverTime = series;
            result.housingGranularity = granularity;
            break;
        }
    }
    return result;
}
