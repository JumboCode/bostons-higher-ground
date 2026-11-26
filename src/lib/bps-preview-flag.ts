/** The synthetic BPS preview stays hidden unless explicitly enabled. It only
 * matches a mock directory, so production admins should not see it until a
 * real, privacy-approved importer exists. NEXT_PUBLIC_ so the admin page
 * (a client component) and the API route read the same switch.
 */
export const BPS_PREVIEW_ENABLED =
    process.env.NEXT_PUBLIC_ENABLE_BPS_PREVIEW === "true";
