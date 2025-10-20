import { HospitalDetailsType } from "@/lib/schemas/hospital-details-schema";
import { create } from "zustand";

type HospitalStore = {
	hospitalInfo: HospitalDetailsType | null;
	setHospitalInfo: (info: HospitalDetailsType) => void;
	clearHospitalInfo: () => void;
};

export const useHospitalStore = create<HospitalStore>((set) => ({
	hospitalInfo: null,
	setHospitalInfo: (info) => set({ hospitalInfo: info }),
	clearHospitalInfo: () => set({ hospitalInfo: null }),
}));
