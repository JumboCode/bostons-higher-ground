import { FileText } from "lucide-react";

type ChartProps = {
    title: string;
};

export default function ReportChart({title} : ChartProps) {
    return <div className="w-36 space-y-2 rounded-2xl bg-[#F9FAFB] p-4 border border-[#E5E7EB] hover:bg-bgh-gray-100 duration-200 cursor-pointer">
      <FileText className="w-[20] h-[20] text-bhg-pink" />
        <div className="font-semibold text-xs">
            {title}
        </div>
    </div>
}