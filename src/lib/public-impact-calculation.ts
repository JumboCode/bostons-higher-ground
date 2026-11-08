import {
    calculateHousedTotal,
    type BaselineValue,
} from "./baseline-calculation";
import { canonicalFamilies } from "./family-metrics";
import { MIN_GROUP_SIZE } from "./chart-definitions";

export type PublicImpactData = {
    familiesHousedToDate: number | null;
    housingOverTime: { month: string; familiesHoused: number | null }[];
    asOfDate: string;
    minimumGroupSize: number;
    provisional: boolean;
};
type ImpactRecord = {
    familyId: string;
    intakeDate: string | null;
    dateHoused: string | null;
};

/** Fixed, unfiltered public release. null means withheld/unavailable, never zero.
 * Monthly counts are first housing AFTER the baseline cutoff, not cumulative.
 * Historical baseline outcomes are not assigned invented housing dates.
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
        asOfDate: today,
        minimumGroupSize: MIN_GROUP_SIZE,
        provisional,
    };
    if (!baseline) return result;
    const { total } = calculateHousedTotal(records, baseline, today);
    result.familiesHousedToDate =
        total === 0 || total >= MIN_GROUP_SIZE ? total : null;
    const counts = new Map<string, number>();
    for (const row of canonicalFamilies(records)) {
        if (
            !row.dateHoused ||
            row.dateHoused <= baseline.asOfDate ||
            row.dateHoused > today
        )
            continue;
        const month = row.dateHoused.slice(0, 7);
        counts.set(month, (counts.get(month) ?? 0) + 1);
    }
    // Fixed calendar range, including zero months, so missing buckets never
    // silently become zero and the range doesn't disclose a first small group.
    const cursor = new Date(`${baseline.asOfDate.slice(0, 7)}-01T00:00:00Z`);
    while (cursor.toISOString().slice(0, 10) <= today) {
        const month = cursor.toISOString().slice(0, 7);
        result.housingOverTime.push({
            month,
            familiesHoused: counts.get(month) ?? 0,
        });
        cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    const hiddenMonths = new Set(
        [...counts.entries()]
            .filter(([, count]) => count < MIN_GROUP_SIZE)
            .map(([month]) => month)
    );
    // Always withhold the headline when a month is hidden. Merely hiding a
    // second bucket is insufficient: e.g. ten positive buckets totaling ten
    // exposes every count as one. Do not release a recoverable hidden subtotal.
    if (
        hiddenMonths.size ||
        (baseline.startingValue > 0 && baseline.startingValue < MIN_GROUP_SIZE)
    )
        result.familiesHousedToDate = null;
    result.housingOverTime = result.housingOverTime.map((point) => ({
        ...point,
        familiesHoused: hiddenMonths.has(point.month)
            ? null
            : point.familiesHoused,
    }));
    return result;
}
