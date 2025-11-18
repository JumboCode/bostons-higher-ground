<<<<<<< HEAD
type FastFactCardProps = {
    title: string;
    body: string;
    subtext: string;
    bgColor: string;
}


export default function FastFactCard({ title, body, subtext, bgColor }: FastFactCardProps){
    return(
        <div className={`w-[250px] h-[140px] pt-[27px] pr-[25px] pl-[25px] rounded-[16px] ${bgColor}`}>
            <p className="text-[#4A4A4A] text-[14px] leading-[20px] font-manrope mb-[8px]">
                {title}
            </p>
            <p className="font-manrope text-[36px] leading-[40px] text-[#1B1B1B] mb-[8px]">
                {body}
            </p>
            <p className="font-manrope text-[12px] leading-[16px] text-[#767676]">
                {subtext}
            </p>
        </div>
    );
}
=======
import React from 'react';

interface FastFactCardProps {
  title: string;
  statistic: string | number;
  description: string;
  bgColor: string; 
}

const FastFactCard: React.FC<FastFactCardProps> = ({ title, statistic, description, bgColor }) => {
  return (
    
    <div className={`p-6 rounded-xl w-72 h-44 ${bgColor}`}>
      <p className="text-gray-700 font-medium text-lg">{title}</p>
      <p className="text-5xl font-bold">{statistic}</p>
      <p className="text-gray-500 text-sm">{description}</p>
    </div>
  );
};

export default FastFactCard;
>>>>>>> cd77ad036f3181f1503b026f2bdfdf4818d8f465
