/*
 * TODO: This component represents the draft report interface that goes at the
 * top of the page. Ultimately, it will list the charts the user has selected to
 * go into their next report, but for now you only need to make the interface
 * drawn on the figma for the case when no charts are selected.
 */
function DraftReport() {
    return (
        <div></div>
    );
}

/*
 * TODO: This component represents a single report in the list of archived
 * reports. As you are designing it, think about what props you need in order to
 * make it reusable.
 */
function ReportEntry() {
    return (
        <div></div>
    );
}

/*
 * TODO: This function is the top level component of the archive page. All of
 * the JSX returned by this function will be rendered on the /reports route.
 * Complete the component to match the designs provided in the ticket.
 */
export default function Archive() {
    return (
        <main>
            {/* we use components within our JSX similarly to html tags*/}
            <DraftReport />
            <ReportEntry />
        </main>
    );
}
