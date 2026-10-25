/*
    Author: Alex Vu
    Date: 10/23/26

    Purpose: page for the public-facing summary of BHG's impact
*/

import PeopleIcons from "@/components/PeopleIcons";

// ponytail: placeholder data, swap for a real query later
const NEED = { count: 97, label: "Families in need of housing" };
const RESPONSE = { count: 81, label: "Families housed through Boston's Higher Ground    " };

function Panel({ title, count, label, className }: { title: string; count: number; label: string; className: string }) {
    return (
        <section className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-bhg-gray-300">{title}</h2>
            <p className="my-2 text-5xl font-bold text-bhg-gray-300">{count}</p>
            <p className="mb-4 text-sm text-bhg-gray-300">{label}</p>
            <PeopleIcons count={count} label={label} className={className} />
        </section>
    );
}

export default function PublicDashboard() {
    return (
        <main className="min-h-screen bg-[#F5F5F5] p-4 md:p-8">
            <h1 className="mb-6 text-2xl font-bold text-bhg-gray-300">Housing</h1>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Panel title="Need" {...NEED} className="text-bhg-pink" />
                <Panel title="Response" {...RESPONSE} className="text-bhg-mint-200" />
            </div>
        </main>
    );
}
