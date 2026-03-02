"use client";

import { Page, Text, View, Document, Image, StyleSheet, PDFViewer, pdf } from "@react-pdf/renderer";
import { ReactElement, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Logo from "../../../public/Logo.png"
import html2canvas from 'html2canvas-pro';

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
        flexDirection: "row",
        flexWrap: "wrap",
        rowGap: 50,
        padding: 24,
    }
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

    // get charts as images
    useEffect(() => {
        async function generateImages() {
            const images = await Promise.all(
                chartRefs.current.map(async (el) => {
                    if (!el) return "";
                    const canvas = await html2canvas(el, { backgroundColor: null });
                    return canvas.toDataURL("image/png");
                })
            );
            setChartImages(images.filter(Boolean));
            setIsLoading(false);
        }

        generateImages();
    }, [charts]);

    // Generate PDF blob and upload via API (uploadFile runs server-side)
    const hasUploadedRef = useRef(false);
    useEffect(() => {
        if (isLoading || hasUploadedRef.current) return;

        let cancelled = false;
        (async () => {
            const doc = (
                <Document title={reportTitle}>
                    <Page size="LETTER">
                        <View style={styles.headerSection}>
                            <Image src={Logo.src} style={{ width: 168 }} />
                            <Text style={styles.header}>{reportTitle}</Text>
                        </View>
                        <View style={styles.chartSection}>
                            {chartImages.length > 0
                                ? chartImages.map((src, i) => (
                                      <Image key={i} src={src} style={{ width: "50%" }} />
                                  ))
                                : null}
                        </View>
                    </Page>
                </Document>
            );
            const blob = await pdf(doc).toBlob();
            if (cancelled) return;
            hasUploadedRef.current = true;
            await fetch("/api/reports/upload-pdf", {
                method: "POST",
                body: blob,
                headers: { "Content-Type": "application/pdf" },
            });
        })();

        return () => {
            cancelled = true;
        };
    }, [reportTitle, chartImages, isLoading]);

    return (
        <>
            {/* cover div with charts */}
            <PDFViewer width="100%" className="h-dvh absolute z-100">
                <Document title={reportTitle}>
                    <Page size="LETTER">
                        <View style={styles.headerSection}>
                            <Image
                                src={Logo.src}
                                style={{ width: 168 }}
                            />
                            <Text style={styles.header}>
                                {reportTitle}
                            </Text>
                        </View>
                        <View style={styles.chartSection}>
                            {chartImages.length > 0 ? (
                                chartImages.map((src, i) => (
                                    <Image
                                        key={i}
                                        src={src}
                                        style={{ width: "50%" }}
                                    />
                                ))
                            ) : (
                                !isLoading && <Text style={{ fontSize: 12, color: "#364152" }}>
                                    No in-progress report found. Add charts using the &quot;+&quot; buttons to see them here.
                                </Text>
                            )}
                        </View>
                    </Page>
                </Document>
            </PDFViewer>
            {/* hidden dom for getting charts as images */}
            <div className="h-dvh overflow-y-scroll">
                {charts.map((chart, i) => (
                    <div
                        key={chart.key}
                        ref={(ele) => { chartRefs.current[i] = ele; }}
                    >
                        {chart.node}
                    </div>
                ))}
            </div>
        </>
    );
}

export default dynamic(() => Promise.resolve(ReportDoc), { ssr: false });
