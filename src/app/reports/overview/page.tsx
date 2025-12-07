import DashboardTop from "@/components/DashboardTop";
import { getAllData } from "@/lib/getAllData";
import FamilyIntakeBarChart from "../housing/barchart";
import LineChart from "../housing/linechart";
import DaysHousedBarChart from "../housing/barchart2";
import Chart from "@/components/chart";

const data = await getAllData();

const filtered_Data = data.filter(function (d) {
    return d.intakeDate?.substring(0, 4) == "2025";
});

const final_Data = filtered_Data.map((d) => ({
    ...d,
    intakeMonth: d.intakeDate ? new Date(d.intakeDate).getMonth() : null,
    housedMonth: d.dateHoused ? new Date(d.dateHoused).getMonth() : null,
}));

export default function Overview() {
    return (
        <div className="w-full">
            <DashboardTop
                pageTitle="Overview"
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
            </div>
        </div>
    );
}
