"use server";

import { getAllData } from "@/lib/getAllData";

export async function fetchHousingData() {
  return await getAllData();
}

