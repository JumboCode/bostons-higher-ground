import { create } from "zustand";
import { type DateRange } from "react-day-picker";

export type Timeframe =
    | "thisMonth"
    | "lastMonth"
    | "thisFY"
    | "allTime"
    | "custom";

export type FilterState = {
    selectedSchools: string[];
    selectedLocations: string[];
    timeframe: Timeframe;
    fiscalYear?: number;
    customRange?: DateRange;
    setSelectedSchools: (schools: string[]) => void;
    setSelectedLocations: (locations: string[]) => void;
    setTimeframe: (timeframe: Timeframe) => void;
    setFiscalYear: (year?: number) => void;
    setCustomRange: (range?: DateRange) => void;
    clearAll: () => void;
};

const initialState = {
    selectedSchools: [] as string[],
    selectedLocations: [] as string[],
    timeframe: "allTime" as Timeframe,
    fiscalYear: undefined as number | undefined,
    customRange: undefined as DateRange | undefined,
};

const useFilters = create<FilterState>((set) => ({
    ...initialState,
    setSelectedSchools: (schools: string[]) =>
        set({ selectedSchools: schools }),
    setSelectedLocations: (locations: string[]) =>
        set({ selectedLocations: locations }),
    setTimeframe: (timeframe: Timeframe) => set({ timeframe }),
    setFiscalYear: (year?: number) => set({ fiscalYear: year }),
    setCustomRange: (range?: DateRange) => set({ customRange: range }),
    clearAll: () => set(initialState),
}));

export default useFilters;
