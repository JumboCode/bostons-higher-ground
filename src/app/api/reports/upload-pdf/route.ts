import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { inProgressReports } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { generateChart, type StoredChart } from "@/lib/generateChart";
import { uploadFile } from "@/lib/upload-file";
import { list, del } from "@vercel/blob";
import React from "react";
import {
    Page,
    Text,
    View,
    Document,
    Image,
    StyleSheet,
    Font,
    renderToBuffer,
} from "@react-pdf/renderer";
import path from "path";

Font.register({
    family: "Poppins",
    fonts: [
        {
            src: path.join(process.cwd(), "public/fonts/Poppins-Bold.ttf"),
            fontWeight: 700,
        },
    ],
});

Font.register({
    family: "Manrope",
    fonts: [
        {
            src: path.join(
                process.cwd(),
                "public/fonts/Manrope-VariableFont_wght.ttf"
            ),
            fontWeight: 400,
        },
    ],
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
        borderTop: "1px solid #e6e7eb",
        margin: 12,
    },
    footerText: {
        fontSize: 10,
        color: "#555555",
        fontFamily: "Manrope",
    },
});

export async function POST(request: Request) {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
        return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    const report = await db.query.inProgressReports.findFirst({
        where: eq(inProgressReports.userId, session.user.id),
    });

    if (!report) {
        return Response.json(
            { error: "no in-progress report found" },
            { status: 404 }
        );
    }

    const charts = Array.isArray(report.charts)
        ? (report.charts as StoredChart[])
        : [];

    const rendered = await Promise.all(
        charts.map(async (chart, idx) => ({
            key: `${chart.title}-${idx}`,
            node: await generateChart(chart, true),
        }))
    );

    const visible = rendered.filter((c) => c.node !== null);

    const reportTitle = report.title ?? "Untitled Report";
    const formattedDate = new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    }).format(new Date());
    const currentYear = new Date().getFullYear();
    const logoPath = path.join(process.cwd(), "public/Logo_black_text.png");

    const doc = React.createElement(
        Document,
        { title: reportTitle },
        React.createElement(
            Page,
            { size: "LETTER", style: styles.pageContent },
            React.createElement(
                View,
                null,
                React.createElement(
                    View,
                    { style: styles.logo },
                    React.createElement(Image, {
                        src: logoPath,
                        style: { width: 250, height: "auto" },
                    })
                ),
                React.createElement(
                    View,
                    { style: { paddingHorizontal: 40 } },
                    React.createElement(
                        Text,
                        { style: styles.header },
                        reportTitle
                    ),
                    React.createElement(
                        Text,
                        { style: styles.subtitle },
                        `Generated on ${formattedDate}`
                    ),
                    React.createElement(View, { style: styles.line }),
                    React.createElement(
                        View,
                        { style: styles.chartSection },
                        ...visible.map((chart, i) =>
                            React.createElement(
                                View,
                                {
                                    key: i,
                                    style: styles.chart,
                                    wrap: false,
                                },
                                React.createElement(
                                    Text,
                                    { style: styles.chartTitle },
                                    chart.key.split("-")[0]
                                ),
                                React.createElement(
                                    View,
                                    { style: { aspectRatio: "1/1" } },
                                    chart.node
                                )
                            )
                        )
                    )
                )
            ),
            // Footer
            React.createElement(
                View,
                { style: styles.footer, fixed: true },
                React.createElement(
                    Text,
                    { style: styles.footerText },
                    `© ${currentYear} Higher Ground Boston`
                ),
                React.createElement(Text, {
                    style: styles.footerText,
                    render: ({
                        pageNumber,
                        totalPages,
                    }: {
                        pageNumber: number;
                        totalPages: number;
                    }) => `Page ${pageNumber} of ${totalPages}`,
                })
            )
        )
    );

    let pdfBuffer: Buffer;
    try {
        pdfBuffer = await renderToBuffer(doc);
    } catch (error) {
        console.error("[reports/upload-pdf] renderToBuffer failed", error);
        return Response.json(
            { error: "pdf generation failed" },
            { status: 500 }
        );
    }

    const pathname = `reports/${session.user.id}/report-${Date.now()}.pdf`;

    try {
        const arrayBuffer = pdfBuffer.buffer.slice(
            pdfBuffer.byteOffset,
            pdfBuffer.byteOffset + pdfBuffer.byteLength
        ) as ArrayBuffer;
        const blob = await uploadFile(pathname, arrayBuffer, {
            access: "public",
            contentType: "application/pdf",
            addRandomSuffix: true,
        });

        return Response.json({
            success: true,
            url: blob.url,
            title: reportTitle,
            chartCount: visible.length,
        });
    } catch (error) {
        console.error("[reports/upload-pdf] uploadFile failed", error);
        return Response.json({ error: "upload failed" }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
        return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    const prefix = `reports/${session.user.id}/`;

    try {
        const { blobs } = await list({ prefix });

        const reports = blobs
            .filter((b) => b.pathname.endsWith(".pdf"))
            .map((b) => ({
                url: b.url,
                pathname: b.pathname,
                uploadedAt: b.uploadedAt,
                size: b.size,
            }))
            .sort(
                (a, b) =>
                    new Date(b.uploadedAt).getTime() -
                    new Date(a.uploadedAt).getTime()
            );

        return Response.json({ success: true, reports });
    } catch (error) {
        console.error("[reports/upload-pdf] list failed", error);
        return Response.json({ error: "failed to list reports" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
        return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const url =
        body && typeof (body as Record<string, unknown>).url === "string"
            ? ((body as Record<string, unknown>).url as string)
            : null;

    if (!url) {
        return Response.json({ error: "missing url" }, { status: 400 });
    }

    try {
        await del(url);
        return Response.json({ success: true });
    } catch (error) {
        console.error("[reports/upload-pdf] delete failed", error);
        return Response.json({ error: "delete failed" }, { status: 500 });
    }
}
