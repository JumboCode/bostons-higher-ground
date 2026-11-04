import { unstable_cache } from "next/cache";

import { db } from "./db";

export const getAllData = unstable_cache(
    () => db.query.housingRecords.findMany(),
    ["housing-data"],
    { tags: ["report-data"], revalidate: 300 }
);
