// Lightweight Salesforce adapter that fetches Account records and maps them to
// the HousingRecord shape used by our charts.

export type HousingRecord = {
    id: string;
    familyId: string;
    intakeDate: string | null;
    dateHoused: string | null;
    currentStatus: string | null;
    sourceOfHousing: string | null;
    city: string | null;
    zipCode: string | null;
    school: string | null;
    schoolId: string | null;
    studentCount: number | null;
    intakeMonth: number | null;
    housedMonth: number | null;
};

type SalesforceQueryResponse = {
    done: boolean;
    totalSize: number;
    nextRecordsUrl?: string;
    records: any[];
};

const BASE_URL = process.env.SALESFORCE_INSTANCE_URL;
const TOKEN = process.env.SALESFORCE_ACCESS_TOKEN;

const SOQL =
    "SELECT Id, Family_Id__c, Intake_Date__c, Date_Housed__c, Current_Status__c, " +
    "Source_of_Housing__c, City__c, Zip_Code__c, BillingCity, BillingPostalCode " +
    "FROM Account WHERE RecordType.DeveloperName = 'FLSI_Household'";

function normalizeStatus(status: string | null | undefined): string | null {
    if (!status) return null;
    const s = status.toLowerCase();
    if (s.includes("housed")) return "housed";
    if (s.includes("waiting") || s.includes("active")) return "active";
    return s;
}

function toMonth(dateStr: string | null | undefined): number | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return Number.isNaN(d.getTime()) ? null : d.getMonth();
}

function mapRecord(record: any): HousingRecord {
    const intakeDate = record.Intake_Date__c ?? null;
    const dateHoused = record.Date_Housed__c ?? null;

    return {
        id: record.Id,
        familyId: record.Family_Id__c ?? record.Id,
        intakeDate,
        dateHoused,
        currentStatus: normalizeStatus(record.Current_Status__c),
        sourceOfHousing: record.Source_of_Housing__c ?? null,
        city: record.City__c ?? record.BillingCity ?? null,
        zipCode: record.Zip_Code__c ?? record.BillingPostalCode ?? null,
        school: null,
        schoolId: null,
        studentCount: null,
        intakeMonth: toMonth(intakeDate),
        housedMonth: toMonth(dateHoused),
    };
}

async function fetchPage(url: string): Promise<SalesforceQueryResponse> {
    if (!TOKEN || !BASE_URL) {
        throw new Error(
            "Missing Salesforce env vars: SALESFORCE_ACCESS_TOKEN / SALESFORCE_INSTANCE_URL"
        );
    }

    const res = await fetch(url, {
        headers: { Authorization: `Bearer ${TOKEN}` },
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
            `Salesforce request failed: ${res.status} ${res.statusText} ${text}`
        );
    }

    return (await res.json()) as SalesforceQueryResponse;
}

export async function getHousingRecordsFromSalesforce(): Promise<
    HousingRecord[]
> {
    if (!BASE_URL) {
        throw new Error("SALESFORCE_INSTANCE_URL is not set");
    }

    const encoded = encodeURIComponent(SOQL);
    let url = `${BASE_URL}/services/data/v65.0/query?q=${encoded}`;
    const all: any[] = [];

    // Paginate until done
    // nextRecordsUrl is relative, so we prepend BASE_URL
    // Loop exits when response.done === true
    while (url) {
        const page = await fetchPage(url);
        all.push(...page.records);
        if (page.done || !page.nextRecordsUrl) break;
        url = `${BASE_URL}${page.nextRecordsUrl}`;
    }

    return all.map(mapRecord);
}
