/*
 * This component represents a single chart entry in the report builder. Given
 * that we want this component to be resuable as multiple charts get selected,
 * think about what props it needs to take as you're designing it.
 */
function ChartEntry() {
    return (
        <div></div>
    );
}

/*
 * This component is the UI for building reports. It should list the charts the
 * user currently has selected to be included in the report, along with any
 * notes to be associated with that chart. Additionally, There should be buttons
 * to download the report/data as a PDF, CSV, or PNG.
 */
export default function ReportBuilder() {
    return (
        <div>
            {/* we use components within our JSX similarly to html tags */}
            <ChartEntry />
        </div>
    );
}
