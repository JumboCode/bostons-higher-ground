import FastFactCard from "@/components/FastFactCard";
import DashboardTop from '@/components/DashboardTop';
import SchoolFilterBar from '@/components/SchoolFilterBar';



export default function Schools(){
    return (
        
        <div className="flex">
            <DashboardTop pageTitle="Schools Dashboard" />
            <div className="flex gap-[70px] ml-[100px] mt-[250px]">
                <FastFactCard title="Homeless Students" body="45" subtext="" bgColor="bg-[#FFE5EA99]"/>
                <FastFactCard title="Families Housed to Date" body="82%" subtext="" bgColor="bg-[#E0F7F4]"/>
                <FastFactCard title="Average Wait Time" body="92%" subtext="" bgColor="bg-[#FDF6EC]"/>
            </div>
            <SchoolFilterBar /> 
                    
        </div>
        
            

    
    );
}


