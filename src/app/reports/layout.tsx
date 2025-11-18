import React from 'react';

import NavBar from "@/components/navbar";
import ReportBuilderToggle from "@/components/report_builder_toggle";


export default function Layout({ children }: {children: React.ReactNode}){
    return(
        <>
        

        <div className="relative w-full h-full min-h-screen flex ">
            <div className="fixed h-full ">
                <NavBar/>
            </div>
            <div className=" absolute w-[1222px] h-[64px] bg-white border-b border-gray-200 flex items-center gap-[100px] px-[20px] ml-[280px] opacity-100">
    
            </div>
            
            
            <div className="bg-[#F5F5F5] min-h-screen w-screen overflow-x-hidden">
                <div className="ml-[250px] mr-[80px] p-4">
                    {children}
                </div>
            </div>

            
            
        </div>
        <div className="fixed right-6 top-6 z-[999999] pointer-events-auto">
            <ReportBuilderToggle/>
        </div>
        
        
        </>
        
    );
}