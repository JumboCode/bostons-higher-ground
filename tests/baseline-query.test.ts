import test from "node:test";
import assert from "node:assert/strict";
import { sql } from "drizzle-orm";

test(
    "database aggregate preserves cutoff, duplicate, whitespace and future-date rules",
    { skip: !process.env.DATABASE_URL },
    async () => {
        const { housedAdditionsQuery } = await import("../src/lib/baselines");
        const { db } = await import("../src/lib/db");
        const result = await db.execute(sql`
        WITH housing_records (family_id, date_housed) AS (VALUES
            ('old', DATE '2025-06-29'),
            ('old', DATE '2025-07-02'),
            ('on', DATE '2025-06-30'),
            ('new', DATE '2025-07-01'),
            (' new ', DATE '2025-07-02'),
            (E'\\tnew\\t', DATE '2025-07-02'),
            ('today', DATE '2026-10-22'),
            ('future', DATE '2026-10-23'),
            ('missing', NULL::date),
            (' ', DATE '2025-07-01')
        )
        ${housedAdditionsQuery("2025-06-30", "2026-10-22")}
    `);
        assert.equal(Number(result.rows[0].additions), 2);
    }
);
