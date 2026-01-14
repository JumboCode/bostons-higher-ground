import { getAllData } from "./getAllData";

/* function's input */
export type Filters = {
    date?: string;
    school?: string;
    location?: string;
};

export async function getFilteredData(filters: Filters) {
    const { date, school, location } = filters;
    const data = await getAllData();
    
    /* filter (or dont) the data based on filters passed in haha */
    return data.filter(record => {
        const matchDate = !date || record.intakeDate === date;
        const matchSchool = !school || record.school === school;
        const matchLocation = !location || record.city === location;

        return matchDate && matchSchool && matchLocation;
    });
}