type FastFactCardProps = {
    title: string;
    body: string;
    subtext: string;
    bgColor: string;
};

export default function FastFactCard({
    title,
    body,
    subtext,
    bgColor,
}: FastFactCardProps) {
    return (
        <div
            className={`relative w-full min-h-[160px] rounded-2xl px-7 pt-6 pb-5 ${bgColor}`}
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
        >
            {/* Subtle decorative circle for depth */}
            <div
                className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-20"
                style={{ background: "rgba(255,255,255,0.7)" }}
            />

            <p className="text-[#6B7280] text-[13px] font-medium tracking-wide uppercase mb-2">
                {title}
            </p>
            <p className="text-[#1B1B1B] text-[38px] font-bold leading-none mb-2 tracking-tight">
                {body}
            </p>
            <p className="text-[#9CA3AF] text-[12px] font-medium">{subtext}</p>
        </div>
    );
}
