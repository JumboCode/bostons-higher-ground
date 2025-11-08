"use client";

import * as d3 from "d3";
import icon from "./Icon.png";
import Image from "next/image";
import { useEffect, useRef } from "react";

import { Poppins, Inter, Manrope } from "next/font/google";


const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400","500","700"],  
  variable: "--font-poppins",

});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400","500","700"],  
  variable: "--font-manrope",

});

/*const inter = Inter({
  subsets: ["latin"],
  weight: ["400","600","700"],     
  variable: "--font-inter",
});*/

type fhtDataPoint = {
  month: string;
  familiesHoused: number;
};
type pshsDataPoint = {
  partnerSchool: string;
  activeCount: number;
  housedCount: number;
};

const fhtDataSet : fhtDataPoint[] = [
    { "month": "Jan", "familiesHoused": 7 },
    { "month": "Feb", "familiesHoused": 10 },
    { "month": "Mar", "familiesHoused": 14 },
    { "month": "Apr", "familiesHoused": 13 },
    { "month": "May", "familiesHoused": 15 },
    { "month": "Jun", "familiesHoused": 12 },
    { "month": "Jul", "familiesHoused": 14 },
    { "month": "Aug", "familiesHoused": 16 },
    { "month": "Sep", "familiesHoused": 18 },
    { "month": "Oct", "familiesHoused": 17 }
];
const pshsDataset : pshsDataPoint[] = [
    { "partnerSchool": "Burke High", "activeCount": 13,  "housedCount": 32},
    { "partnerSchool": "TechBoston Academy", "activeCount": 20,  "housedCount": 10},
    { "partnerSchool": "McCormack Middle", "activeCount": 10,  "housedCount": 33},
    { "partnerSchool": "King K-8", "activeCount": 14,  "housedCount": 29},
    { "partnerSchool": "Orchard Gardens K-8", "activeCount": 13,  "housedCount": 33}
];
const empthySet : pshsDataPoint[] = [
];


function drawHorizontalBarChart(svgElement: SVGSVGElement, data: pshsDataPoint[]) {

}

function drawLineChart(svgElement: SVGSVGElement, data: fhtDataPoint[]) {

}

export default function D3Demo() {
  const barRef = useRef<SVGSVGElement | null>(null);
  const lineRef = useRef<SVGSVGElement | null>(null);

//   useEffect(() => {
//     if (barRef.current) drawBarChart(barRef.current, mockDataOne);
//     if (lineRef.current) drawLineChart(lineRef.current, mockDataTwo);
//   }, []);

  return (
    <div className="bg-[#F5F5F5] flex flex-col items-center space-y-12 mt-10 relative">
        <div className="flex flex-col items-start w-[820px]">
             <h1 className= {poppins.className + " text-3xl font-bold text-[#555555]"}>
                Overview Dashboard
            </h1>
        </div>
       
        <div className=" bg-[#FFFFFF] w-[773px] h-[404px] rounded-[16px] border-t border-t-[#0000001A] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] p-6 relative">
            {fhtDataSet.length > 0 ? (
                <>  
                    <h2 
                    className= {poppins.className + "text-lg font-semibold mb-2 text-[#555555] text-left"}
                    >
                    New Intakes vs Families Housed (Monthly)
                    </h2>
                    <svg ref={barRef}></svg>

                </>
            ):(
                <div className="flex flex-col items-center justify-center text-center h-full space-y-3">
                    <Image
                    src={icon}
                    alt="icon"
                    width={40}
                    height={40}
                    />
                    <div className="flex flex-col items-center justify-center text-center">
                        <h1 className={poppins.className + "text-base font-semibold mb-2 text-[#4A5565] "}>
                            No data for this filter — try adjusting date or school
                        </h1>
                        <p className={manrope.className + " text-sm text-center font-semibold mb-2 text-[#6A7282] "}>
                            Switch to a different time period or select All Schools
                        </p>
                    </div>
                    
                </div>
            )}

                
        </div>
        <div className="flex justify-center gap-[40px] mt-10 relative">
            <div className="bg-[#FFFFFF] w-[374.5px] h-[428px] rounded-[16px] border-t border-t-[#0000001A] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] p-6">
                {pshsDataset.length > 0 ? (
                <>
                    <h2
                        className={poppins.className + "text-[18px]  font-semibold mb-2 text-[#555555] text-left"}
                        >
                        Partner Schools and Homeless Student Count
                    </h2>
                    <svg ref={lineRef}></svg>
                </>
                ) : (
                <div className="flex flex-col items-center justify-center text-center h-full space-y-3">
                    <Image
                    src={icon}
                    alt="icon"
                    width={40}
                    height={40}
                    />
                    <div className="flex flex-col items-center justify-center text-center">
                        <h1 className={poppins.className + "text-base font-semibold mb-2 text-[#4A5565] "}>
                            No data for this filter — try adjusting date or school
                        </h1>
                        <p className={manrope.className + " text-sm text-center font-semibold mb-2 text-[#6A7282] "}>
                            Switch to a different time period or select All Schools
                        </p>
                    </div>
                    
                </div>
                )}

                
            </div>

            <div className="bg-[#FFFFFF] w-[374.5px] h-[428px] rounded-[16px] border-t border-t-[#0000001A] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)] p-6">
                {empthySet.length > 0 ? (
                    <>
                        <h2 className= {poppins.className + "text-[18px] font-semibold mb-2 text-[#555555] text-left"}>
                        Emotional Wellbeing & Improvement by Stage
                        </h2>
                        <svg ref={lineRef}></svg>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center h-full space-y-3">
                        <Image
                        src={icon}
                        alt="icon"
                        width={40}
                        height={40}
                        />
                        <div className="flex flex-col items-center justify-center text-center">
                            <h1 className={poppins.className + "text-base font-semibold mb-2 text-[#4A5565] "}>
                                No data for this filter — try adjusting date or school
                            </h1>
                            <p className={manrope.className + " text-sm text-center font-semibold mb-2 text-[#6A7282] "}>
                                Switch to a different time period or select  All Schools 
                            </p>
                        </div>
                        
                    </div>
                )}
        </div>
      </div>
    
      
    </div>
  );
}