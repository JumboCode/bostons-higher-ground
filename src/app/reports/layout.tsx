import React from "react";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import NavBar from "@/components/navbar";
import ReportBuilderToggle from "@/components/report_builder_toggle";
import { authClient } from "@/lib/auth-client";

export default async function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    const userName = session?.user.name;

    return (
        <>
            <NavBar />

            <div className="ml-[280px] bg-[#F5F5F5] min-h-screen flex flex-col">
                <div className="min-h-[40px] bg-white flex justify-end px-5 py-3 sticky top-0 z-30">
                    {userName || "John Doe"}
                </div>

                <div className="flex-1">{children}</div>
            </div>
            <ReportBuilderToggle />
        </>
    );
}
