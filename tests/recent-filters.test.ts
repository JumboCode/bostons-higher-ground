import test from "node:test";
import assert from "node:assert/strict";
import useFilters from "../src/lib/filterStore";
import { filterRecords } from "../src/lib/applyFilters";
import {
    buildChartModel,
    type HousingChartRecord,
} from "../src/lib/chart-definitions";

test("defaults and clear restore past two years; all time remains available", (t) => {
    t.mock.timers.enable({ apis: ["Date"], now: new Date(2026, 9, 22, 12) });
    const records = [
        "2024-10-21",
        "2024-10-22",
        "2026-10-22",
        "2026-10-23",
    ].map(
        (date, id) =>
            ({
                id,
                familyId: String(id),
                intakeDate: date,
                dateHoused: date,
                currentStatus: "housed",
                sourceOfHousing: null,
                city: null,
                zipCode: null,
                school: null,
                schoolId: null,
                studentCount: null,
            }) satisfies HousingChartRecord
    );
    assert.equal(useFilters.getState().timeframe, "pastTwoYears");
    assert.deepEqual(filterRecords(records, useFilters.getState()).map(record => record.id), [1, 2]);
    useFilters.getState().setTimeframe("allTime");
    assert.equal(filterRecords(records, useFilters.getState()).length, 4);
    useFilters.getState().clearAll();
    assert.equal(useFilters.getState().timeframe, "pastTwoYears");
    const model = buildChartModel(
        "families-housed-line",
        records,
        useFilters.getState()
    );
    assert.equal(model.type, "line");
    if (model.type === "line")
        assert.equal(
            model.data.reduce((sum, point) => sum + point.value, 0),
            2
        );
});
