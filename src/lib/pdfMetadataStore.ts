import { create } from "zustand";

export type PdfMetadata = {
    filename: string;
    titleError: string | null;
    setFilename: (name: string) => void;
    setTitleError: (error: string | null) => void;
};

export const usePdfMetadataStore = create<PdfMetadata>((set) => ({
    filename: "",
    titleError: null,
    setFilename: (name) => set({ filename: name, titleError: null }),
    setTitleError: (error) => set({ titleError: error }),
}));
