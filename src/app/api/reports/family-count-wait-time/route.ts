import type { DateRange } from "react-day-picker";

import { filterRecords } from "@/lib/applyFilters";
import { auth } from "@/lib/auth";
import { parseFilters } from "@/lib/generateChart";
import { getAllData } from "@/lib/getAllData";
import { canonicalFamilies } from "@/lib/family-metrics";

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

    // Filter records first, then merge each family's in-window records, so a
    // family that returned for a new intake in the window is still counted.
    const filtered = canonicalFamilies(filterRecords(await getAllData(), {
        selectedLocations: parsed.selectedLocations ?? [],
        selectedSchools: parsed.selectedSchools ?? [],
        timeframe: parsed.timeframe ?? "allTime",
        fiscalYear: parsed.fiscalYear,
        customRange: parsed.customRange as DateRange | undefined,
    }));

    // Intake and housing from the same record (never across two intake episodes).
    const waitTimes = filtered
        .map((record) => record.daysToHouse)
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
