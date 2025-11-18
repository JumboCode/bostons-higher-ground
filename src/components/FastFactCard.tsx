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