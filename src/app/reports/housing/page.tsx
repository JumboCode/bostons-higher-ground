import HousingClient from "./housing-client";
import { getHousingRecordsFromSalesforce } from "@/lib/salesforceHousing";

// Fetch directly from Salesforce for now (option A).
const sfData = await getHousingRecordsFromSalesforce();

// Temporary filter for input data (keep existing behavior)
const filtered_Data = sfData.filter(
    (d) => d.intakeDate?.substring(0, 4) === "2025"
);

// Coerce to the numeric id expected by charts while preserving the Salesforce id in familyId
const final_Data = filtered_Data.map((d, idx) => ({
    ...d,
    id: idx + 1,
}));

export default function Housing() {
    return <HousingClient data={final_Data} />;
}
