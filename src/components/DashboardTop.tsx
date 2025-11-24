

import React from 'react';
import FastFactCard from "@/components/FastFactCard";
import { RefreshCcw } from 'lucide-react';

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
  bgColor2: string
  mt: string;
}

const DashboardTop: React.FC<DashboardTopProps> = ({ pageTitle, title, body, subtext, bgColor, title1, title2, bgColor1, bgColor2, body1, body2, subtext1, subtext2, mt}) => {
  return (
    <>
    <div className="w-full flex flex-col p-8 ml-10">
      
      {}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-extrabold text-[#555555] gap-8">{pageTitle}</h1>
        
        {}
        <button className="flex items-center border border-[#E76C82] text-[#E76C82] py-2 px-4 rounded-lg transition-colors hover:bg-pink-50">
          <div className="w-[16px]">
            <RefreshCcw/>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">...</svg>
          <span className="text-lg">Update Data</span>
        </button>
      
      </div>

    </div>

    <div className="flex">
                       
      <div className={`flex gap-[70px] ml-[80px] ${mt}`}>
          <FastFactCard title={title} body={body} subtext={subtext} bgColor={bgColor}/>
          <FastFactCard title={title1} body={body1} subtext={subtext1} bgColor={bgColor1}/>
          <FastFactCard title={title2} body={body2} subtext={subtext2} bgColor={bgColor2}/>
      </div>
                
    </div>
    </>
  );
};

export default DashboardTop;