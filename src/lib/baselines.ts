import { db } from "./db";
import { housingRecords, metricBaselines } from "./schema";
import { eq, sql } from "drizzle-orm";
import {
    calculateHousedTotal,
    bostonToday,
    FAMILIES_HOUSED,
    provisionalBaseline,
    type BaselineValue,
} from "./baseline-calculation";

type CounterRecord = {
    familyId: string;
    intakeDate: string | null;
    dateHoused: string | null;
};

export function housedAdditionsQuery(asOfDate: string, today: string) {
    // Match JavaScript trim for family IDs.
    const whitespace =
        "\u0009\u000a\u000b\u000c\u000d\u0020\u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff";
    return sql`
        SELECT count(*)::integer AS additions FROM (
            SELECT btrim(family_id, ${whitespace}) AS family,
                   min(date_housed) AS first_housed
            FROM ${housingRecords}
            WHERE date_housed <= ${today}::date
            GROUP BY 1
        ) AS families
        WHERE family <> '' AND first_housed > ${asOfDate}::date
    `;
}

export async function getHousedBaselineSummary(
    existingRecords?: Promise<CounterRecord[]>
) {
    let baseline: BaselineValue | undefined;
    let migrationRequired = false;
    try {
        [baseline] = await db
            .select()
            .from(metricBaselines)
            .where(eq(metricBaselines.metric, FAMILIES_HOUSED))
            .limit(1);
    } catch (error) {
        const cause = error as { code?: string; cause?: { code?: string } };
        if (cause.code === "42P01" || cause.cause?.code === "42P01")
            migrationRequired = true;
        else throw error;
    }
    const today = bostonToday();
    const records = existingRecords ? await existingRecords : undefined;
    let effectiveBaseline: BaselineValue | null = baseline ?? null;
    if (!effectiveBaseline) {
        if (records) effectiveBaseline = provisionalBaseline(records, today);
        else {
            const [first] = await db
                .select({
                    intakeDate: sql<
                        string | null
                    >`min(${housingRecords.intakeDate})::text`,
                })
                .from(housingRecords)
                .where(sql`${housingRecords.intakeDate} <= ${today}::date`);
            effectiveBaseline = provisionalBaseline([first], today);
        }
    }
    if (!effectiveBaseline)
        return {
            baseline: null,
            additions: null,
            total: null,
            migrationRequired,
            provisional: false,
        };
    const count = records
        ? calculateHousedTotal(records, effectiveBaseline, today)
        : await db
              .execute(housedAdditionsQuery(effectiveBaseline.asOfDate, today))
              .then((result) => {
                  const additions = Number(result.rows[0].additions);
                  return {
                      additions,
                      total: effectiveBaseline.startingValue + additions,
                  };
              });
    return {
        baseline: {
            startingValue: effectiveBaseline.startingValue,
            asOfDate: effectiveBaseline.asOfDate,
        },
        ...count,
        migrationRequired,
        provisional: !baseline,
    };
}
export type HousedBaselineSummary = Awaited<
    ReturnType<typeof getHousedBaselineSummary>
>;
