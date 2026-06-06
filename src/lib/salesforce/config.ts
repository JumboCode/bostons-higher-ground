/**
 * Salesforce field-mapping config.
 *
 * Each entry maps a column in our `housing_records` table to a Salesforce
 * field API name on the configured SObject (default: Account).
 *
 * Required fields MUST exist on the SObject for the sync to run at all.
 * Optional fields are best-effort: if the field doesn't exist on the SObject
 * (or isn't configured), the sync still completes and the corresponding DB
 * column is left NULL. Charts that depend on those columns will simply have
 * empty/zero buckets rather than crashing.
 *
 * Env-var overrides let you change a name without code edits, useful while
 * Salesforce schema is still being finalized.
 */

export type HousingRecordColumn =
    | "familyId"
    | "intakeDate"
    | "dateHoused"
    | "currentStatus"
    | "sourceOfHousing"
    | "city"
    | "zipCode"
    | "school"
    | "schoolId"
    | "studentCount";

export type FieldMapping = {
    column: HousingRecordColumn;
    /** Salesforce field API name. `null` means "not configured / skip". */
    sfField: string | null;
    /** If true, sync aborts when this field is missing from the SObject. */
    required: boolean;
    /** "string" | "date" | "integer" — used to coerce raw SF values. */
    type: "string" | "date" | "integer";
};

function envOr(envKey: string, fallback: string): string {
    const v = process.env[envKey];
    return v && v.trim() !== "" ? v.trim() : fallback;
}

function envOrNull(envKey: string, fallback: string | null): string | null {
    const v = process.env[envKey];
    if (v === undefined) return fallback;
    const trimmed = v.trim();
    return trimmed === "" ? null : trimmed;
}

/**
 * The Salesforce SObject we read from. Default: standard `Account`.
 * Override with `SALESFORCE_SOBJECT` env var.
 */
export const SF_SOBJECT = envOr("SALESFORCE_SOBJECT", "Account");

/**
 * Optional SOQL `WHERE` filter (without the leading "WHERE") to scope which
 * Account records we pull. Example: `RecordType.DeveloperName = 'Family'`.
 * Leave empty to pull every Account.
 */
export const SF_QUERY_FILTER = envOrNull("SALESFORCE_QUERY_FILTER", null);

export const FIELD_MAPPINGS: FieldMapping[] = [
    {
        column: "familyId",
        sfField: envOr("SALESFORCE_FIELD_FAMILY_ID", "Family_Id__c"),
        required: true,
        type: "string",
    },
    {
        column: "intakeDate",
        sfField: envOr("SALESFORCE_FIELD_INTAKE_DATE", "Intake_Date__c"),
        required: false,
        type: "date",
    },
    {
        column: "dateHoused",
        sfField: envOr("SALESFORCE_FIELD_DATE_HOUSED", "Date_Housed__c"),
        required: false,
        type: "date",
    },
    {
        column: "currentStatus",
        sfField: envOr("SALESFORCE_FIELD_CURRENT_STATUS", "Current_Status__c"),
        required: false,
        type: "string",
    },
    {
        column: "sourceOfHousing",
        sfField: envOr(
            "SALESFORCE_FIELD_SOURCE_OF_HOUSING",
            "Source_of_Housing__c"
        ),
        required: false,
        type: "string",
    },
    {
        column: "city",
        sfField: envOr("SALESFORCE_FIELD_CITY", "City__c"),
        required: false,
        type: "string",
    },
    {
        column: "zipCode",
        sfField: envOr("SALESFORCE_FIELD_ZIP_CODE", "Zip_Code__c"),
        required: false,
        type: "string",
    },
    // The next three are unknown in the source Salesforce org as of writing.
    // They default to null; charts depending on them will be empty until
    // the env vars below are set to real Salesforce field API names.
    {
        column: "school",
        sfField: envOrNull("SALESFORCE_FIELD_SCHOOL", null),
        required: false,
        type: "string",
    },
    {
        column: "schoolId",
        sfField: envOrNull("SALESFORCE_FIELD_SCHOOL_ID", null),
        required: false,
        type: "string",
    },
    {
        column: "studentCount",
        sfField: envOrNull("SALESFORCE_FIELD_STUDENT_COUNT", null),
        required: false,
        type: "integer",
    },
];

export type SalesforceCredentials = {
    clientId: string;
    clientSecret: string;
    loginUrl: string;
};

export function readSalesforceCredentials(): SalesforceCredentials {
    const clientId = process.env.SALESFORCE_CLIENT_ID;
    const clientSecret = process.env.SALESFORCE_CLIENT_SECRET;
    const loginUrl = envOr(
        "SALESFORCE_LOGIN_URL",
        "https://login.salesforce.com"
    );

    if (!clientId || !clientSecret) {
        throw new Error(
            "Salesforce credentials are not configured. Set SALESFORCE_CLIENT_ID and SALESFORCE_CLIENT_SECRET in your environment."
        );
    }

    return { clientId, clientSecret, loginUrl };
}
