import { db } from "./db";

export async function getAllData() {
    return await db.query.housingRecords.findMany();
}
