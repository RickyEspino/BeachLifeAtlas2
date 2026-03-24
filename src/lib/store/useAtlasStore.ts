import { create } from "zustand";
import { AtlasExperience } from "@/types/atlas";

export interface AtlasState {
  experience: AtlasExperience | null;
  setExperience: (exp: AtlasExperience) => void;
}

export const useAtlasStore = create<AtlasState>((set) => ({
  experience: null,
  setExperience: (exp) => set({ experience: exp }),
}));
