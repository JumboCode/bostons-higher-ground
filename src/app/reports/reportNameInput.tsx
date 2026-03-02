"use client";

import { SquarePen } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

export default function ReportNameInputClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initial = useMemo(() => searchParams.get("reportName") ?? "", [searchParams]);
  const [name, setName] = useState(initial);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setName(next);

    const params = new URLSearchParams(searchParams.toString());
    if (next.trim()) params.set("reportName", next);
    else params.delete("reportName");

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-col ReportNameEdit space-y-1">
      <div className="text-sm font-medium">Report Name</div>
      <div className="ReportNameTextField">
        <div className="relative w-full">
          <SquarePen className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={name}
            onChange={onChange}
            placeholder="Enter report name (e.g., October 2025 Housing Report)"
            className="w-full text-sm pl-9 pr-3 p-2 bg-[#F3F3F5] rounded-2xl font-normal focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}