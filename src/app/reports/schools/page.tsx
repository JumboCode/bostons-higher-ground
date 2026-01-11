import { getAllData } from "@/lib/getAllData";
import SchoolsClient from "./schools-client";

// Grabbing all data from the database
const data = await getAllData();

export default function Schools() {
    return <SchoolsClient data={data} />;
}
