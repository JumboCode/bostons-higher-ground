import type { Timeframe } from "./filterStore";
import type { DateRange } from "react-day-picker";

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

export function buildChartTitle(
    baseTitle: string,
    timeframe: Timeframe,
    fiscalYear?: number,
    customRange?: DateRange
): string {
    const today = new Date();
    switch (timeframe) {
        case "thisMonth":
            return `${baseTitle} in ${MONTHS[today.getMonth()]} ${today.getFullYear()}`;
        case "lastMonth": {
            const d = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            return `${baseTitle} in ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
        }
        case "thisFY":
            return `${baseTitle} in ${fiscalYear ?? today.getFullYear()}`;
        case "custom":
            if (customRange?.from && customRange?.to) {
                return `${baseTitle} Between ${customRange.from.toLocaleDateString()} and ${customRange.to.toLocaleDateString()}`;
            }
            return baseTitle;
        default:
            return baseTitle;
    }
}
