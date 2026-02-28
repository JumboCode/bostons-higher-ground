"use client";

import {
    Page,
    Text,
    View,
    Document,
    Image,
    StyleSheet,
    PDFViewer,
    Font,
} from "@react-pdf/renderer";
import { ReactElement, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import html2canvas from "html2canvas-pro";
import { LoaderCircle } from "lucide-react";

Font.register({
    family: "Poppins",
    fonts: [{ src: "/fonts/Poppins-Bold.ttf", fontWeight: 700 }],
});

Font.register({
    family: "Manrope",
    fonts: [{ src: "/fonts/Manrope-VariableFont_wght.ttf", fontWeight: 400 }],
});

const styles = StyleSheet.create({
    logo: {
        flexDirection: "column",
        alignItems: "center",
        padding: 24,
    },
    header: {
        fontSize: 24,
        fontWeight: "bold",
        fontFamily: "Poppins",
        color: "#555555",
    },
    subtitle: {
        fontSize: 12,
        fontFamily: "Manrope",
        fontWeight: 400,
        color: "#6A7282",
    },
    line: {
        borderBottom: "1px solid #E76C82",
        marginVertical: 12,
    },
    content: {
        paddingHorizontal: 40,
    },
    chartSection: {
        flexDirection: "row",
        flexWrap: "wrap",
        rowGap: 12,
    },
    chart: {
        width: "100%",
    },
    chartTitle: {
        fontSize: 10,
        fontFamily: "Poppins",
        fontWeight: 700,
        color: "#555555",
    },
    bgColor: {
        backgroundColor: "aliceblue",
    },
});

function ReportDoc({
    reportTitle,
    charts,
}: {
    reportTitle: string;
    charts: { key: string; node: ReactElement | null }[];
}) {
    const [chartImages, setChartImages] = useState<string[]>([]);
    const chartRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [date, setDate] = useState<string>("");

    // get charts as images
    useEffect(() => {
        async function generateImages() {
            const images = await Promise.all(
                chartRefs.current.map(async (el) => {
                    if (!el) return "";
                    const canvas = await html2canvas(el, {
                        backgroundColor: null,
                    });
                    return canvas.toDataURL("image/png");
                })
            );
            const date = new Date();
            const formattedDate = new Intl.DateTimeFormat("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
            }).format(date);
            setDate(formattedDate);
            setChartImages(images.filter(Boolean));
            setIsLoading(false);
        }

        generateImages();
    }, [charts]);

    return (
        <>
            {!isLoading && (
                <PDFViewer width="100%" className="h-dvh absolute z-100">
                    <Document title={reportTitle}>
                        <Page size="LETTER">
                            <View style={styles.logo}>
                                <Image
                                    src={"/Logo_black_text.png"}
                                    style={{ width: 250, height: "auto" }}
                                />
                            </View>
                            <View style={styles.content}>
                                <Text style={styles.header}>{reportTitle}</Text>
                                <Text style={styles.subtitle}>
                                    Generated on {date}
                                </Text>
                                <View style={styles.line}></View>
                                <View style={styles.chartSection}>
                                    {chartImages.length > 0 ? (
                                        chartImages.map((src, i) => (
                                            <View key={i} style={styles.chart}>
                                                <Text style={styles.chartTitle}>
                                                    {
                                                        charts[i].key.split(
                                                            "-"
                                                        )[0]
                                                    }
                                                </Text>
                                                <Image
                                                    src={src}
                                                    style={[
                                                        styles.bgColor,
                                                        { width: "50%" },
                                                    ]}
                                                />
                                            </View>
                                        ))
                                    ) : (
                                        <Text
                                            style={{
                                                fontSize: 12,
                                                color: "#364152",
                                            }}
                                        >
                                            No in-progress report found. Add
                                            charts using the &quot;+&quot;
                                            buttons to see them here.
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </Page>
                    </Document>
                </PDFViewer>
            )}
            {/* cover div with charts */}
            <div className="w-full h-dvh absolute z-50 bg-white flex items-center justify-center-safe">
                <div className="flex gap-3.5 items-center">
                  <LoaderCircle size={40} className="animate-spin" color="#E76C82"/>
                  <p className="font-manrope">Loading...</p>
                </div>
            </div>
            {/* hidden dom for getting charts as images */}
            <div className="h-dvh overflow-y-scroll">
                {charts.map((chart, i) => (
                    <div
                        key={chart.key}
                        ref={(ele) => {
                            chartRefs.current[i] = ele;
                        }}
                    >
                        {chart.node}
                    </div>
                ))}
            </div>
        </>
    );
}

export default dynamic(() => Promise.resolve(ReportDoc), { ssr: false });
