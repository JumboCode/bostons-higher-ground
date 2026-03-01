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
import { ReactElement, useEffect, useState } from "react";
import dynamic from "next/dynamic";
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
    pageContent: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
    },
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
        marginTop: 12,
    },
    chartSection: {
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        rowGap: 12,
    },
    chart: {
        width: "48%",
        marginTop: 12,
    },
    chartTitle: {
        fontSize: 10,
        fontFamily: "Poppins",
        fontWeight: 700,
        color: "#555555",
        marginBottom: 4,
    },
    footer: {
      display: "flex",
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 5,
      borderTop: '1px solid #e6e7eb',
      margin: 12,
    },
    footerText: {
      fontSize: 10,
      color: "#555555",
      fontFamily: "Manrope"
    }
});

function Footer() {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>&copy; {currentYear} Higher Ground Boston</Text>
      <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
        `Page ${pageNumber} of ${totalPages}`
      )} />
    </View>
  )
}

function ReportDoc({
    reportTitle,
    charts,
}: {
    reportTitle: string;
    charts: { key: string; node: ReactElement | null }[];
}) {
    const [isLoading, setIsLoading] = useState(true);
    const [date, setDate] = useState<string>("");

    useEffect(() => {
        const date = new Date();
        const formattedDate = new Intl.DateTimeFormat("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        }).format(date);
        setDate(formattedDate);
        setIsLoading(false);
    }, [charts]);

    return (
        <>
            {!isLoading && (
                <PDFViewer width="100%" className="h-dvh absolute z-100">
                    <Document title={reportTitle}>
                        <Page size="LETTER" style={styles.pageContent}>
                            <View>
                              <View style={styles.logo}>
                                  <Image
                                      src={"/Logo_black_text.png"}
                                      style={{ width: 250, height: "auto" }}
                                  />
                              </View>
                              <View style={{ paddingHorizontal: 40 }}>
                                  <Text style={styles.header}>{reportTitle}</Text>
                                  <Text style={styles.subtitle}>
                                      Generated on {date}
                                  </Text>
                                  <View style={styles.line}></View>
                                  <View style={styles.chartSection}>
                                      {charts.length > 0 ? (charts.map((chart, i) => (
                                          <View key={i} style={styles.chart} wrap={false}>
                                              <Text style={styles.chartTitle}>{charts[i].key.split("-")[0]}</Text>
                                              <View style={{ aspectRatio: "1/1" }}>{chart.node}</View>
                                          </View>
                                      ))) : (
                                          <Text style={{ fontSize: 12, color: "#364152", }}>
                                              No in-progress report found. Add charts using the &quot;+&quot; buttons to see them here.
                                          </Text>
                                      )}
                                  </View>
                              </View>
                            </View>
                            <Footer />
                        </Page>
                    </Document>
                </PDFViewer>
            )}
            {/* loader div */}
            <div className="w-full h-dvh absolute z-50 bg-white flex items-center justify-center-safe">
                {<div className="flex gap-3.5 items-center">
                  <LoaderCircle size={40} className={isLoading ? "animate-spin" : ""} color="#E76C82"/>
                  <p className="font-manrope">Loading...</p>
                </div>}
            </div>
        </>
    );
}

export default dynamic(() => Promise.resolve(ReportDoc), { ssr: false });
