import ReportBuilder from "@/components/report_builder"
import ReportBuilderToggle from "@/components/report_builder_toggle";

export default function Home() {
    return (
        <>
            {/* <div className="w-screen h-screen flex flex-row justify-center items-center">
            <div className="w-screen h-screen flex flex-row justify-center items-center">
                <h1 className="text-2xl">Boston's Higher Ground!</h1>
            </div> */}
            <div>
                <ReportBuilderToggle/>
            </div>
        </>
    );
}
