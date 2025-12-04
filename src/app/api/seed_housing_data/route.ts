import { db } from "@/lib/db";
import { housingRecords } from "@/lib/schema";
import { faker } from "@faker-js/faker";

const statuses = ["active", "housed", "waiting"];
const cities = ["Boston", "Cambridge", "Somerville", "Roxbury", "Dorchester"];
const schools = ["Lincoln High", "Jefferson Middle", "Maple Elementary", "Northview High"];
const sources = ["Shelter Program", "Voucher", "Public Housing", "Private Rental"];

const NUM_RECORDS = 100;

async function seedHousingData() {
    const data = Array.from({ length: NUM_RECORDS }).map((_, i) => {
        const intake = faker.date.past({ years: 1 });
        const housed = faker.helpers.maybe(() => faker.date.between({ from: intake, to: new Date() }), {
            probability: 0.5,
        });
        const status = housed ? "housed" : faker.helpers.arrayElement(statuses);

        return {
            familyId: `FAM-${1000 + i}`,
            intakeDate: intake.toISOString().split("T")[0],
            dateHoused: housed ? housed.toISOString().split("T")[0] : null,
            currentStatus: status,
            sourceOfHousing: housed ? faker.helpers.arrayElement(sources) : null,
            city: faker.helpers.arrayElement(cities),
            zipCode: faker.location.zipCode("#####"),
            school: faker.helpers.arrayElement(schools),
            schoolId: `SCH-${faker.number.int({ min: 100, max: 999 })}`,
            studentCount: faker.number.int({ min: 1, max: 5 }),
        };
    });

    await db.insert(housingRecords).values(data);
    console.log(`✅ Seeded ${NUM_RECORDS} dummy housing records.`);
}

// export async function GET() {
//     await seedHousingData();
//     return new Response("success!");
// }
