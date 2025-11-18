import DashboardTop from '@/components/DashboardTop';

export default function Housing(){
    return(
        
        <div className="ml-[30px] w-[1050px] mt-[30px]">
            <DashboardTop pageTitle="Housing Dashboard" title= "Total Families Enrolled" body="224" subtext="All-time enrollment" bgColor="bg-[#E0F7F4]" title1="Families Housed to Date" title2="Average Wait Time" bgColor1="bg-[#F0E7ED]" bgColor2="bg-[#FFF8E9]" body1="158" body2="48 days" subtext1="70.5% success rate" subtext2="Intake to housed" mt="-mt-[10px]" />
        </div>
        
        
        
        
    );
}