import Navbar from "@/components/navbar";

// import font
import { Manrope } from "next/font/google";
const manrope = Manrope({ subsets:["latin"] });

import { Poppins } from "next/font/google";
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["700"], // bold weight
});

import { Funnel } from 'lucide-react';

export default function Home() {
    return (
        <div className="flex min-h-screen bg-[#F5F5F5]">
            <Navbar />
            <div className="flex-1 overflow-x-hidden">
                {/*Top bar*/}
                <div className="flex flex-row items-center w-full h-[70px] border-b border-[#E5E7EB] bg-[#FFFFFF]">
                    <div className={`flex items-center ${manrope.className} text-[#4A5565]`}>
                        <Funnel className="ml-[25px] mr-[10px] w-[20px] h-[20px] text-[#6A7282]"/>
                        Filters:
                    </div>
                    {/* The three actual filters */}
                    <div>

                    </div>
                    {/* Clear Button */}
                    <button className={`flex justify-center items-center ${manrope.className} bg-[#E76C82] text-[#EBEDEF] rounded-2xl ml-auto h-[30px] px-[20px] py-[20px] mr-[25px]`}>
                        Clear
                    </button>
                </div>
            </div>
        </div>
    );
}