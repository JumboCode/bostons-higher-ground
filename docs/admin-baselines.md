# Families housed baseline

In **Admin Settings → Families housed baseline**, set the starting total and inclusive as-of date, then save. The overview adds distinct families first housed after that date, through today. Duplicate families count once; invalid and future housing dates are excluded.

The total uses synced Salesforce records and stays independent of report filters. The overview reuses chart records; admin requests use database aggregates. Saved baselines survive syncs. Reports default to the past two years.

Working baseline: **0 through May 17, 2017**, pending BHG confirmation. Before a baseline is saved, the app suggests zero through the day before the earliest intake date.

Storage requires `drizzle/0004_metric_baselines.sql`, already applied to the configured database. It was applied directly, without replaying the migration chain. Older snapshots omit existing education tables; this migration preserves that pre-existing gap.

Tests:
```sh
node --env-file=.env.local --import tsx --test tests/*.test.ts
node node_modules/typescript/bin/tsc --noEmit
```

Browser check passed: baseline 0 → 1 changed the total 172 → 173; restoring 0 returned it to 172.
