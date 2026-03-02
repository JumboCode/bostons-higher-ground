"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Download } from "lucide-react";

function buildPreviewHref(format: "pdf" | "csv" | "png", reportName: string) {
  const safe = reportName.trim() || "untitled";
  const path = encodeURIComponent(safe);
  const params = new URLSearchParams();
  params.set("format", format);
  params.set("reportName", safe); 
  return `/preview?${params}`;
}

export default function ExportButtonsClient() {
  const searchParams = useSearchParams();
  const reportName = searchParams.get("reportName") ?? "";

  const baseBtn =
    "flex flex-row items-center space-x-4 border border-[rgba(0,0,0,0.1)] rounded-2xl p-3 w-45 h-10 hover:bg-[#d75c6f] hover:text-[#FFFFFF]";

  return (
    <div className="ExportOptions flex flex-col md:flex-row md:space-x-3 space-y-3 w-full">
      <Link href={buildPreviewHref("pdf", reportName)} className={baseBtn}>
        <span>Export as PDF</span>
        <Download className="w-4 h-4" />
      </Link>

      <Link href={buildPreviewHref("csv", reportName)} className={baseBtn}>
        <span>Export as CSV</span>
        <Download className="w-4 h-4" />
      </Link>

      <Link href={buildPreviewHref("png", reportName)} className={baseBtn}>
        <span>Export as PNG</span>
        <Download className="w-4 h-4" />
      </Link>
    </div>
  );
}