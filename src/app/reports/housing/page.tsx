import { getAllData } from "@/lib/getAllData";
import HousingClient from "./housing-client";

// Grabbing all data from the database
const data = await getAllData();

// Temporary filter for input data
// TODO: write function to connect front end filtering to this function
const filtered_Data = data.filter(function (d) {
    return d.intakeDate?.substring(0, 4) == "2025";
});

const final_Data = filtered_Data.map((d) => ({
    ...d,
    intakeMonth: d.intakeDate ? new Date(d.intakeDate).getMonth() : null,
    housedMonth: d.dateHoused ? new Date(d.dateHoused).getMonth() : null,
}));

export default function Housing() {
    return <HousingClient data={final_Data} />;
}
