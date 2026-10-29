import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import SyncStatusBanner, {
    type SyncLogRow,
} from "../src/components/SyncStatusBanner";

// tsx uses the classic JSX runtime for this project's preserved JSX.
Object.assign(globalThis, { React });
const success: SyncLogRow = {
    id: "success",
    source: "salesforce",
    status: "success",
    startedAt: "2026-10-28T12:00:00Z",
    finishedAt: "2026-10-28T12:01:00Z",
    rowsSynced: 12,
    rowsSkipped: 3,
    missingFields: ["City__c"],
    errorMessage: null,
    triggeredBy: "admin",
};
for (const status of ["success", "error", "running"] as const) {
    test(`banner uses last successful dataset warnings during ${status}`, () => {
        const html = renderToStaticMarkup(
            <SyncStatusBanner
                latest={{
                    ...success,
                    id: "newer",
                    status,
                    missingFields: ["School__c"],
                    rowsSkipped: 99,
                    errorMessage: "failed",
                }}
                latestSuccess={success}
                triggerError={null}
            />
        );
        assert.match(html, /City__c/);
        assert.doesNotMatch(html, /School__c/);
        assert.match(html, /3 skipped \(missing familyId\)/);
        assert.doesNotMatch(html, /99 skipped/);
    });
}
test("no successful sync does not invent counts or warnings", () => {
    const html = renderToStaticMarkup(
        <SyncStatusBanner
            latest={null}
            latestSuccess={null}
            triggerError={null}
        />
    );
    assert.match(html, /Never/);
    assert.doesNotMatch(html, /skipped|City__c/);
});
