import { FileText, X } from "lucide-react";

type ChartProps = {
    title: string;
    onDelete?: () => void;
};

export default function ReportChart({title, onDelete } : ChartProps) {
    return <div className="relative group w-36 space-y-2 rounded-2xl bg-[#F9FAFB] p-4 border border-[#E5E7EB] duration-200 cursor-pointer hover:bg-gray-50 hover:shadow-md transition-shadow">
      <FileText className="w-[20] h-[20] text-bhg-pink" />
        <div className="font-semibold text-xs">
            {title}
        </div>

        
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white text-gray-600 
                            flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 
                            transition-opacity duration-150 hover:bg-[#E76C82] hover:text-white">
                <X className="w-3 h-3" />
        </div>

        
    </div>
}