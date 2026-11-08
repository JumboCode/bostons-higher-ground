import test from "node:test";
import assert from "node:assert/strict";
import { validateTarget } from "../scripts/lib/migration-history-reconciliation.mjs";
const env = {
    BRANCH_DATABASE_URL:
        "postgresql://u:p@ep-test-123.us-east-1.aws.neon.tech/db?sslmode=require",
    RECONCILE_ALLOWED_HOST: "ep-test-123.us-east-1.aws.neon.tech",
    RECONCILE_PRODUCTION_HOST: "ep-prod-456.us-east-1.aws.neon.tech",
};
test("pg query parameters cannot redirect an allowlisted branch to production", () => {
    for (const query of [
        "host=ep-prod-456.us-east-1.aws.neon.tech",
        "hostaddr=127.0.0.1",
        "options=endpoint%3Dep-prod-456",
        "sslmode=disable",
        "sslrootcert=/private/key",
        "user=other",
    ]) {
        assert.throws(
            () =>
                validateTarget({
                    ...env,
                    BRANCH_DATABASE_URL: env.BRANCH_DATABASE_URL + "&" + query,
                }),
            /connection|TLS|parameter/i,
            query
        );
    }
});
test("accepted connections enforce certificate validation and a confirmed production endpoint", () => {
    const url = validateTarget(env);
    assert.equal(url.searchParams.get("sslmode"), "verify-full");
    assert.throws(
        () =>
            validateTarget({
                ...env,
                RECONCILE_PRODUCTION_HOST: "https://production",
            }),
        /production endpoint/i
    );
    assert.throws(
        () =>
            validateTarget({
                ...env,
                BRANCH_DATABASE_URL: env.BRANCH_DATABASE_URL.replace(
                    "/db?",
                    ":1234/db?"
                ),
            }),
        /port/i
    );
});
test("ambient startup options cannot override the confirmed Neon endpoint", () => {
    assert.throws(
        () => validateTarget({ ...env, PGOPTIONS: "endpoint=ep-prod-456" }),
        /PGOPTIONS/
    );
});
