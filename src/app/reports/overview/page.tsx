import { getAllData } from "@/lib/getAllData";
import OverviewClient from "./overview-client";

const data = await getAllData();

const final_Data = data.map((d) => ({
    ...d,
    intakeMonth: d.intakeDate ? new Date(d.intakeDate).getMonth() : null,
    housedMonth: d.dateHoused ? new Date(d.dateHoused).getMonth() : null,
}));

export default function Overview() {
    return <OverviewClient data={final_Data} />;
}
