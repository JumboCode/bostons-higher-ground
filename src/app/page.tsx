import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    } else {
        redirect("/reports/overview");
    }

    return (
        <div className="w-screen h-screen flex flex-row justify-center items-center">
            <h1 className="text-2xl">Boston&apos;s Higher Ground!</h1>
        </div>
    );
}
