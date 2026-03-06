import { create } from "zustand";

export type PdfMetadata = {
    filename: string;
    setFilename: (name: string) => void;
};

export const usePdfMetadataStore = create<PdfMetadata>((set) => ({
    filename: "",
    setFilename: (name) => set({ filename: name }),
}));
