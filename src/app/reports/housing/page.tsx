import DashboardTop from "@/components/DashboardTop";
import { getAllData } from "@/lib/getAllData";
import { Poppins, Manrope } from "next/font/google";
import FamilyIntakeBarChart from "./barchart";
import LineChart from "./linechart";
import DaysHousedBarChart from "./barchart2";
import Chart from "@/components/chart";
import LocationBarChart from "./locationchart";

const poppins = Poppins({
    subsets: ["latin"],
    weight: ["400", "500", "700"],
    variable: "--font-poppins",
});

const manrope = Manrope({
    subsets: ["latin"],
    weight: ["400", "500", "700"],
    variable: "--font-manrope",
});

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
    // console.log(final_Data)
    return (
        <div className="w-full">
            <DashboardTop
                pageTitle="Housing Dashboard"
                title="Total Families Enrolled"
                body="224"
                subtext="All-time enrollment"
                bgColor="bg-[#E0F7F4]"
                title1="Families Housed to Date"
                title2="Average Wait Time"
                bgColor1="bg-[#F0E7ED]"
                bgColor2="bg-[#FFF8E9]"
                body1="158"
                body2="48 days"
                subtext1="70.5% success rate"
                subtext2="Intake to housed"
                mt="-mt-[10px]"
            />
            <div className="p-20">
                <Chart
                    title="Family Intake Over Time"
                    appliedFilters="Fiscal Year 2025"
                >
                    <FamilyIntakeBarChart data={final_Data} />
                </Chart>

                <Chart
                    title="Families Housed Over Time"
                    appliedFilters="Fiscal Year 2025"
                >
                    <LineChart data={final_Data} />
                </Chart>

                <Chart
                    title="Days to House Distribution"
                    appliedFilters="Fiscal Year 2025"
                >
                    <DaysHousedBarChart data={final_Data} />
                </Chart>

                <Chart
                    title="Active vs Housed Families by Location"
                    appliedFilters="Fiscal Year 2025"
                >
                    <LocationBarChart data={final_Data} />
                </Chart>
            </div>
        </div>
    );
}
