import DashboardTop from "@/components/DashboardTop";
import SchoolFilterBar from "@/components/SchoolFilterBar";
import { getAllData } from "@/lib/getAllData";
import Chart from "@/components/chart";
import PartnerAndHomeless from "./partnerandhomeless";
import SchoolsByCityChart from "./schoolsbycity";
import HousingSourceChart from "./housingsource";
import StudentsByCityChart from "./studentsbycity";

// Grabbing all data from the database
const data = await getAllData();

type schoolRecord = {
    id: number;
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
    waitTime?: number;
};

const filtered_Data = data
    .filter(
        (d): d is schoolRecord & { intakeDate: string } => d.intakeDate !== null
    )
    .map((d) => ({
        ...d,
        intakeDate: new Date(d.intakeDate),
        dateHoused: d.dateHoused ? new Date(d.dateHoused) : null,
    }));

filtered_Data.forEach((d) => {
    const today = new Date();
    let diffMs: number;
    if (d.dateHoused == null) {
        diffMs = today.getTime() - d.intakeDate.getTime();
    } else {
        diffMs = d.dateHoused.getTime() - d.intakeDate.getTime();
    }
    const diffDay = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    d.waitTime = diffDay;
});

export default function Schools() {
    // console.log(filtered_Data);
    return (
        <>
            <div className="w-full">
                <DashboardTop
                    pageTitle="Schools Dashboard"
                    title="Homeless Students"
                    body="45"
                    subtext=""
                    bgColor="bg-[#FFE5EA99]"
                    title1="Families Housed to Date"
                    title2="Average Wait Time"
                    bgColor1="bg-[#E0F7F4]"
                    bgColor2="bg-[#FDF6EC]"
                    body1="82%"
                    body2="92%"
                    subtext1=""
                    subtext2=""
                    mt="mt-10"
                    children={<SchoolFilterBar />}
                />
            </div>
            <div className="p-20">
                <Chart
                    title="Partner Schools & Homeless Student Counts"
                    appliedFilters="Fiscal Year 2025"
                >
                    <PartnerAndHomeless data={data} />
                </Chart>
                <Chart
                    title="Schools by City"
                    appliedFilters="Fiscal Year 2025"
                >
                    <div className="w-[600px]">
                        <SchoolsByCityChart data={data} />
                    </div>
                </Chart>
                <Chart
                    title="Housing Sources"
                    appliedFilters="Fiscal Year 2025"
                >
                    <HousingSourceChart data={data} />
                </Chart>
                <Chart
                    title="Students by City"
                    appliedFilters="Fiscal Year 2025"
                >
                    <div className="w-[600px]">
                        <StudentsByCityChart data={data} />
                    </div>
                </Chart>
            </div>
        </>
    );
}
