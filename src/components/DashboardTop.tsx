import React from "react";
import FastFactCard from "@/components/FastFactCard";
import { RefreshCcw } from "lucide-react";

interface DashboardTopProps {
    pageTitle: string;
    title: string;
    title1: string;
    title2: string;
    body: string;
    body1: string;
    body2: string;
    subtext: string;
    subtext1: string;
    subtext2: string;
    bgColor: string;
    bgColor1: string;
    bgColor2: string;
    mt: string;
    children?: React.ReactNode;
}

const DashboardTop: React.FC<DashboardTopProps> = ({
    pageTitle,
    title,
    body,
    subtext,
    bgColor,
    title1,
    title2,
    bgColor1,
    bgColor2,
    body1,
    body2,
    subtext1,
    subtext2,
    mt,
}) => {
    return (
        <>
            <div className="w-full px-4 sm:px-6 lg:px-10">
                <div className="flex w-full max-w-7xl flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:py-8 lg:py-10">
                    <h1 className="text-2xl font-extrabold text-[#555555] sm:text-3xl lg:text-4xl">
                        {pageTitle}
                    </h1>
                </div>
            </div>

            <div className="w-full px-10 pb-2">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    <FastFactCard
                        title={title}
                        body={body}
                        subtext={subtext}
                        bgColor={bgColor}
                    />
                    <FastFactCard
                        title={title1}
                        body={body1}
                        subtext={subtext1}
                        bgColor={bgColor1}
                    />
                    <FastFactCard
                        title={title2}
                        body={body2}
                        subtext={subtext2}
                        bgColor={bgColor2}
                    />
                </div>
            </div>
        </>
    );
};

export default DashboardTop;
