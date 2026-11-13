// Fake data for the /impact wireframe. No real people. Swap for the cached
// real loaders once BHG signs off on a design.
import type {
    AttendanceRecord,
    ChartDataSource,
    GradeRecord,
    HousingChartRecord,
    StudentRecord,
} from "@/lib/chart-definitions";

// Seeded PRNG so every render shows the same numbers.
function rng(seed: number) {
    return () => {
        seed = (seed * 1664525 + 1013904223) % 2 ** 32;
        return seed / 2 ** 32;
    };
}

const pick = <T,>(rand: () => number, items: T[]) =>
    items[Math.floor(rand() * items.length)];

// Last school is deliberately tiny so MIN_GROUP_SIZE suppression is visible.
const SCHOOLS: [string, number][] = [
    ["Mather Elementary", 70],
    ["Holmes Innovation", 60],
    ["Henderson K-12", 55],
    ["Shaw Elementary", 45],
    ["Dever Academy", 40],
    ["Tiny Pilot School", 6],
];
const CITIES = ["Dorchester", "Roxbury", "Mattapan", "East Boston"];
const GRADES = ["K1", "K2", "1", "2", "3", "4", "5", "6", "7", "8"];
const SUBJECTS = ["ELA", "Math", "Science", "Social Studies"];

const iso = (d: Date) => d.toISOString().slice(0, 10);

export function getMockImpactData(): ChartDataSource {
    const rand = rng(42);
    const students: StudentRecord[] = [];
    const attendance: AttendanceRecord[] = [];
    const grades: GradeRecord[] = [];
    let id = 1;

    for (const [schoolName, size] of SCHOOLS) {
        for (let i = 0; i < size; i++, id++) {
            students.push({
                studentId: id,
                schoolName,
                gradeLevel: pick(rand, GRADES),
                city: pick(rand, CITIES),
                zip: pick(rand, [2121, 2119, 2126, 2128]),
            });
            attendance.push({
                schoolName,
                studentId: id,
                ada: (0.7 + rand() * 0.3).toFixed(2),
            });
            for (const rubricName of SUBJECTS) {
                const fall = 1.5 + rand() * 2;
                grades.push({
                    schoolName,
                    rubricName,
                    fMark: fall.toFixed(1),
                    wMark: Math.min(4, fall + rand() * 0.6).toFixed(1),
                    finalMark: Math.min(4, fall + rand() * 0.8).toFixed(1),
                });
            }
        }
    }

    const now = Date.now();
    const day = 86_400_000;
    const housing: HousingChartRecord[] = Array.from({ length: 160 }, (_, i) => {
        const intake = new Date(now - rand() * 700 * day);
        const housed = rand() < 0.8 ? new Date(intake.getTime() + (30 + rand() * 200) * day) : null;
        return {
            id: i + 1,
            intakeDate: iso(intake),
            dateHoused: housed && housed.getTime() < now ? iso(housed) : null,
            currentStatus: housed ? "housed" : "active",
            sourceOfHousing: null,
            city: pick(rand, CITIES),
            zipCode: null,
            school: null,
            schoolId: null,
            studentCount: null,
        };
    });

    return { housing, students, attendance, grades };
}
