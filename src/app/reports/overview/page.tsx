import FastFactCard from "@/components/FastFactCard";


export default function Overview(){
    return(
        <div className="flex">
            
            <div className="flex gap-[70px] ml-[100px] mt-[135px]">
                <FastFactCard title="Total Families Enrolled" body="224" subtext="All-time enrollment" bgColor="bg-[#E0F7F4]"/>
                <FastFactCard title="Families Housed to Date" body="158" subtext="70.5% success rate" bgColor="bg-[#F0E7ED]"/>
                <FastFactCard title="Average Wait Time" body="48 days" subtext="Intake to housed" bgColor="bg-[#FFF8E9]"/>
            </div>
            
        </div>
        
    );
}