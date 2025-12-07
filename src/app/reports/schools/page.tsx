import FastFactCard from "@/components/FastFactCard";
import DashboardTop from "@/components/DashboardTop";
import SchoolFilterBar from "@/components/SchoolFilterBar";

export default function Schools() {
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
