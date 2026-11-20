/** Read-only audit. Prints schema metadata and aggregate counts, never family IDs or names. */
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

async function main() {
    const { getSalesforceConnection } = await import(
        "../src/lib/salesforce/client"
    );
    const { SF_SOBJECT, FIELD_MAPPINGS } = await import(
        "../src/lib/salesforce/config"
    );
    const conn = await getSalesforceConnection();
    const types = await conn.query(
        `SELECT DeveloperName, Name FROM RecordType WHERE SobjectType = '${SF_SOBJECT}'`
    );
    console.log(
        "Record type metadata:",
        JSON.stringify(
            types.records.map((row) => ({
                DeveloperName: row.DeveloperName,
                Name: row.Name,
            }))
        )
    );
    const counts = await conn.query(
        `SELECT RecordType.DeveloperName, COUNT(Id) FROM ${SF_SOBJECT} GROUP BY RecordType.DeveloperName`
    );
    console.log("Accounts by record type:", JSON.stringify(counts.records));
    const describe = await conn.sobject(SF_SOBJECT).describe();
    const available = new Set(describe.fields.map((f) => f.name));
    console.log(
        "Mapped fields:",
        JSON.stringify(
            FIELD_MAPPINGS.filter((m) => m.sfField).map((m) => ({
                column: m.column,
                field: m.sfField,
                available: available.has(m.sfField!),
            }))
        )
    );
    const projection = [
        ...new Set([
            "Id",
            ...FIELD_MAPPINGS.flatMap((m) =>
                m.sfField && available.has(m.sfField) ? [m.sfField] : []
            ),
        ]),
    ];
    let page = await conn.query<Record<string, unknown>>(
        `SELECT ${projection.join(", ")} FROM ${SF_SOBJECT} WHERE RecordType.DeveloperName = 'FLSI_Household'`
    );
    const accounts = [...page.records];
    while (!page.done && page.nextRecordsUrl) {
        page = await conn.queryMore<Record<string, unknown>>(
            page.nextRecordsUrl
        );
        accounts.push(...page.records);
    }
    const familyField = FIELD_MAPPINGS.find(
        (m) => m.column === "familyId"
    )!.sfField!;
    const intakeField = FIELD_MAPPINGS.find(
        (m) => m.column === "intakeDate"
    )!.sfField!;
    const groups = new Map<string, Record<string, unknown>[]>();
    let skipped = 0;
    for (const row of accounts) {
        const family = String(row[familyField] ?? "").trim();
        if (!family) {
            skipped++;
            continue;
        }
        groups.set(family, [...(groups.get(family) ?? []), row]);
    }
    const repeated = [...groups.values()].filter((rows) => rows.length > 1);
    console.log(
        "Salesforce program-family audit:",
        JSON.stringify({
            programAccounts: accounts.length,
            skippedMissingFamilyId: skipped,
            validAccounts: accounts.length - skipped,
            distinctFamilies: groups.size,
            repeatedFamilyIds: repeated.length,
            extraRows: accounts.length - skipped - groups.size,
            repeatedGroupsWithDistinctAccountIds: repeated.filter(
                (rows) => new Set(rows.map((r) => r.Id)).size === rows.length
            ).length,
            repeatedGroupsWithMultipleIntakeDates: repeated.filter(
                (rows) =>
                    new Set(rows.map((r) => r[intakeField]).filter(Boolean))
                        .size > 1
            ).length,
            repeatedGroupsWithIdenticalMappedFields: repeated.filter(
                (rows) =>
                    new Set(
                        rows.map((r) =>
                            JSON.stringify(
                                projection
                                    .filter((f) => f !== "Id")
                                    .map((f) => r[f])
                            )
                        )
                    ).size === 1
            ).length,
        })
    );
    const { neon } = await import("@neondatabase/serverless");
    const query = neon(process.env.DATABASE_URL!);
    const result = await query.query(`WITH families AS (
            SELECT btrim(family_id) AS family, count(*) AS n,
                count(DISTINCT intake_date) AS intake_dates,
                count(DISTINCT date_housed) AS housed_dates,
                count(DISTINCT current_status) AS statuses,
                count(DISTINCT city) AS cities,
                count(DISTINCT source_of_housing) AS sources
            FROM housing_records GROUP BY 1
        ) SELECT sum(n)::int AS rows, count(*)::int AS distinct_families,
            count(*) FILTER (WHERE n > 1)::int AS repeated_family_ids,
            sum(n - 1)::int AS extra_rows,
            count(*) FILTER (WHERE n > 1 AND intake_dates > 1)::int AS differing_intake_dates,
            count(*) FILTER (WHERE n > 1 AND housed_dates > 1)::int AS differing_housed_dates,
            count(*) FILTER (WHERE n > 1 AND statuses > 1)::int AS differing_statuses,
            count(*) FILTER (WHERE n > 1 AND cities > 1)::int AS differing_cities,
            count(*) FILTER (WHERE n > 1 AND sources > 1)::int AS differing_housing_sources
        FROM families`);
    console.log("Database family audit:", JSON.stringify(result[0]));
    console.log(
        "Database baseline:",
        JSON.stringify(
            await query.query(
                "SELECT metric, starting_value, as_of_date::text FROM metric_baselines"
            )
        )
    );
}
main().catch((error) => {
    console.error(error instanceof Error ? error.message : "Audit failed");
    process.exitCode = 1;
});
