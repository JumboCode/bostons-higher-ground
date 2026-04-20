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
    children,
}) => {
    return (
        <>
            <div className="w-full px-4 sm:px-6 lg:px-10">
                <div className="flex w-full flex-col items-start justify-between gap-4 py-6 sm:flex-row sm:items-center sm:py-10">
                    <h1 className="text-3xl font-extrabold text-[#555555] sm:text-4xl">
                        {pageTitle}
                    </h1>
                    <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#E76C82] px-4 py-2 text-sm text-[#E76C82] transition-colors hover:bg-pink-50 sm:w-auto sm:text-base">
                        <div className="w-[16px] shrink-0">
                            <RefreshCcw />
                        </div>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 shrink-0"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            ...
                        </svg>
                        <span className="text-base sm:text-lg">Update Data</span>
                    </button>
                </div>
            </div>

            {/* <div>{children}</div> */}

            <div className="w-full px-4 sm:px-6 lg:px-10">
                <div className="grid w-full grid-cols-1 justify-items-center gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
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
