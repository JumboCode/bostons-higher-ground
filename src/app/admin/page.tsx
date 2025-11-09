"use client";
import { useState } from "react";
import NavBar from "../../components/navbar";

// import font
import { Manrope } from "next/font/google";
const manrope = Manrope({ subsets:["latin"] });

// import popins
import { Poppins } from "next/font/google";
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["700"], // bold weight
});

import {Search, CircleCheckBig, UsersRound, Send} from "lucide-react";

type Props = {
    isOpen: boolean;
    onClose: () => void;
}

function InviteCard ({ isOpen, onClose }: Props){
    if(!isOpen) return null;
    return(
        <div className="absolute top-[350px] left-[500px] bg-[#e3c3d4] w-[400px] h-[200px] ">
        <button 
            onClick={onClose}
            >
            Close
        </button>

    </div>
    );
    
}

export default function Admin(){
    const [isOpen, setIsOpen] = useState(false);

    return (
        <main className="relative min-h-screen bg-[#F5F5F5] ">
            <div className="relative overflow-x-hidden min-h-[717px]">
                {/*Top bar*/}
                <div className=" left-[286px] w-[835px] h-[64px] border-b border-[#E5E7EB] px-[760px] gap-[100px] bg-[#FFFFFF]"></div>

                {/*Title*/}
                <div className=" absolute top-[84px] left-[286px] ">
                    <h1 className="text-[#555555] text-[28px] leading-[42px] font-poppins font-bold ">
                        Admin Settings
                    </h1>
                </div>

                {/*Alert Box */}
                <div className="absolute top-[129px] w-[768px] h-[46px] left-[286px] bg-[#4CAF501A] border border-[#4CAF5033] rounded-[16px] px-4 flex items-center">
                    <CircleCheckBig className="w-[16px] h-[16px] top-[15px] left-[17px] text-[#555555]"/>
                    <p className="font-manrope text-[14px] text-[#555555] leading-[20px] pl-[10px]">
                        Last sync from Salesforce: 
                    </p>
                </div>
            

                {/*Table*/}
                <div className="absolute top-[180px] w-[768px] h-[448px] left-[286px] border border-[#0000001A] rounded-[20px] bg-[#FFFFFF] p-[24px] flex flex-col mx-auto mt-[30px]">
                    <div className="flex gap-[12px]">
                        <div className=" w-[40px] h-[40px] rounded-[16px] bg-[#F0E7ED] flex items-center justify-center">
                                <UsersRound className="w-[20px] h-[20px] text-[#E76C82]"/>
                        </div>

                        <h2 className="text-[#555555] text-[20px] leading-[30px] font-poppins font-semibold w-[189] h-[30px]">
                        User Management
                        </h2>

                        {/*Invite Staff*/}
                        <button 
                                onClick={() => setIsOpen(true)}
                                className="absolute right-[24px] w-[127px] h-[36px] rounded-[14px] bg-[#E76C82] flex items-center justify-center
                                text-[#FFFFFF] font-manrope text-[14px] leading-[20px] gap-[10px]">
                                <Send className=" w-[16px] h-[16px] top-[10px] left-[12px]"/>
                                Invite Staff   
                        </button>
                    </div>

                    <p className=" -mt-[15px] w-[72px] h-[21px] font-manrope text-[14px] leading-[21px] text-[#ABABAB] ml-[52px]">
                        members
                    </p>

                    {/*Search bar*/}
                    <div className="relative">
                        <Search className="mt-[12px] absolute left-[12px] top-[13.5px] w-[20px] h-[20px] text-[#ABABAB]"/>
                        <input
                            type="text"
                            placeholder="Search by name or email..."                                  
                            className="mt-[12px] top-[66px] w-[719px] h-[47px] rounded-[14px] border border-[#D9D9D9] px-[44px] py-[12px] pr-[16px] outline-none ring-0 placeholder:text-neutral-400 focus:border-rose-300 focus:bg-white focus:shadow focus:shadow-rose-100">
                        </input>
                    </div>
                </div>
            </div>


            {/*Footer*/}
            <div className="absolute bottom-0 w-full h-[66px] border-t border-[#E5E7EB] px-[32px] flex items-center justify-center">
                <footer className=" w-[329px] h-[16px] py-[24px] pt-[25px] left-[361.38px] text-[12px] text-[#6A7282]"
                >
                    © 2025 Higher Ground Boston. For authorized staff use only.
                </footer>
            </div> 
            
            <InviteCard isOpen={isOpen} onClose={() => setIsOpen(false)}/>

        </main>
    );
}