import { create } from "zustand"

const useFilters = create((set) => ({
    selectedSchools: [],
    setSelectedSchools: (schools: string[]) => set({ selectedSchools: schools }),
}));
