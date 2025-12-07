import FastFactCard from "@/components/FastFactCard";
import DashboardTop from "@/components/DashboardTop";
import SchoolFilterBar from "@/components/SchoolFilterBar";
import { getAllData } from "@/lib/getAllData";
import { Poppins, Manrope } from "next/font/google";
import { filter } from "d3";
import { dateDuration } from "drizzle-orm/gel-core";

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
                    mt="mt-[135px]"
                />
            </div>
            <div className="-mt-[300px] pl-10 pr-30 w-full">
                <SchoolFilterBar />
            </div>
        </>
    );
}
