import type { DateRange } from "react-day-picker";

import { filterRecords } from "@/lib/applyFilters";
import { auth } from "@/lib/auth";
import { parseFilters } from "@/lib/generateChart";
import { getAllData } from "@/lib/getAllData";

// Filtered family count + average intake-to-housed wait time for the overview, computed server-side so raw housing rows stay off the client.
export async function POST(request: Request) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
        return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as {
        filters?: unknown;
    } | null;
    const parsed = parseFilters(
        typeof body?.filters === "string" ? body.filters : null
    );

    const filtered = filterRecords(await getAllData(), {
        selectedLocations: parsed.selectedLocations ?? [],
        selectedSchools: parsed.selectedSchools ?? [],
        timeframe: parsed.timeframe ?? "allTime",
        fiscalYear: parsed.fiscalYear,
        customRange: parsed.customRange as DateRange | undefined,
    });

    const waitTimes = filtered
        .map((record) => {
            if (!record.intakeDate || !record.dateHoused) return null;
            const days =
                (new Date(record.dateHoused).getTime() -
                    new Date(record.intakeDate).getTime()) /
                (1000 * 60 * 60 * 24);
            return Number.isFinite(days) ? days : null;
        })
        .filter((days): days is number => days !== null);

    return Response.json({
        totalFamilies: filtered.length,
        averageWaitDays: waitTimes.length
            ? Math.round(
                  waitTimes.reduce((sum, days) => sum + days, 0) /
                      waitTimes.length
              )
            : null,
    });
}
