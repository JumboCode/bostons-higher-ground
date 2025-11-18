<<<<<<< HEAD
import FastFactCard from "@/components/FastFactCard";


export default function Schools(){
    return (
        <div className="flex">
                    
                    <div className="flex gap-[70px] ml-[100px] mt-[250px]">
                        <FastFactCard title="Homeless Students" body="45" subtext="" bgColor="bg-[#FFE5EA99]"/>
                        <FastFactCard title="Families Housed to Date" body="82%" subtext="" bgColor="bg-[#E0F7F4]"/>
                        <FastFactCard title="Average Wait Time" body="92%" subtext="" bgColor="bg-[#FDF6EC]"/>
                    </div>
                    
                </div>
    );
}
=======
import DashboardTop from '@/components/DashboardTop';
import SchoolFilterBar from '@/components/SchoolFilterBar';

export default function SchoolsPage() {
  return (
    <div className="min-h-screen">
      
      {}
      <DashboardTop pageTitle="Schools Dashboard" />
      
      {}
      <SchoolFilterBar /> 
      
      
    </div>
  );
}
>>>>>>> cd77ad036f3181f1503b026f2bdfdf4818d8f465
