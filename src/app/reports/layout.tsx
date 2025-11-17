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

            <div className="ml-[250px] mr-[80px] p-4 overflow-visible">
                {children}
                
            </div>
            
        </div>
        <div className="fixed right-6 top-6 z-[999999] pointer-events-auto">
            <ReportBuilderToggle/>
        </div>
        </>
        
    );
}