// ReportDoc.client.tsx
"use client";

import { Page, Text, View, Document, Image, StyleSheet, PDFViewer } from "@react-pdf/renderer";
import { JSXElementConstructor, ReactElement } from "react";
import dynamic from "next/dynamic";
import { createTw } from "react-pdf-tailwind";
import Logo from "../../../public/Logo.png"

const tw = createTw({
    colors: {
        "bghGray300": "#2D2D2D",
    },
});

const styles = StyleSheet.create({
    headerSection: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 24,
        backgroundColor: "#2D2D2D",
    },
    header: {
        fontSize: 24,
        fontWeight: "bold",
        color: "white",
    },
    chartSection: {
        flexWrap: "wrap",
        rowGap: 80,
        columnGap: 56,
        padding: 24,
    },
    testColor: {
        backgroundColor: "#F9FAFB",
    }
});

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
                    <View style={styles.headerSection}>
                        <Image
                            src={Logo.src}
                            style={tw("w-56 h-auto")}
                        />
                        <Text style={styles.header}>
                            {reportTitle}
                        </Text>
                    </View>
                    <View style={styles.chartSection}>
                        {charts.length > 0 ? (
                            charts.map((chart, idx) => (
                                // <div key={chart.key} className="flex-1 min-w-[calc(50%-3.5rem)] ">{chart.node}</div>
                                // <Text key={idx} style={styles.testColor}>chart here</Text>
                                <View key={idx}>{chart.node}</View>
                            ))
                        ) : (
                            <Text style={tw(`text-gray-600 text-sm`)}>
                                No in-progress report found. Add charts using the &quot;+&quot; buttons to see them here.
                            </Text>
                        )}
                    </View>
                    {/*
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
