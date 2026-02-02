// ReportDoc.client.tsx
"use client";

import { Page, Text, View, Document, StyleSheet, PDFViewer } from "@react-pdf/renderer";
import { JSXElementConstructor, ReactElement } from "react";
import dynamic from "next/dynamic";

function ReportDoc({
    reportTitle,
    charts,
}: {
    reportTitle: string;
    charts: { key: string; node: ReactElement<unknown, string | JSXElementConstructor<any>> | null }[];
}) {
    return (
        <PDFViewer width="100%" className="h-dvh">
            <Document title={reportTitle}>
                <Page size="LETTER">
                    <View>
                        <Text>hi</Text>
                    </View>
                    {/* <div className={`print:[print-color-adjust:exact] bg-bhg-gray-300 flex justify-between items-center p-6`}>
                        <Image
                            src="/Logo.svg"
                            alt="Boston Higher Ground logo"
                            className="w-56 h-auto"
                            width={60}
                            height={20}
                            priority
                        />
                        <h1 className="text-3xl font-semibold text-white">
                            {reportTitle}
                        </h1>
                    </div>
                    <div className="flex flex-wrap gap-x-28 gap-y-20 p-10">
                        {charts.length > 0 ? (
                            charts.map((chart) => (
                                <div key={chart.key} className="flex-1 min-w-[calc(50%-3.5rem)] ">{chart.node}</div>
                            ))
                        ) : (
                            <div className="text-gray-600">
                                The saved charts could not be rendered. Add a chart to
                                your report and try again.
                            </div>
                        )}
                    </div> */}
                </Page>
            </Document>
        </PDFViewer>
    );
}

export default dynamic(() => Promise.resolve(ReportDoc), { ssr: false });
