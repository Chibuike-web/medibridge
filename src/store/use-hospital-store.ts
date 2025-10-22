import { HospitalDetailsType } from "@/lib/schemas/hospital-details-schema";
import { create } from "zustand";

export type HospitalType = HospitalDetailsType & {
	file: File | null;
};

type HospitalStore = {
	hospitalInfo: HospitalType | null;
	setHospitalInfo: (info: Partial<HospitalType>) => void;
	clearHospitalInfo: () => void;
};

export const useHospitalStore = create<HospitalStore>((set) => ({
	hospitalInfo: null,
	setHospitalInfo: (info) =>
		set((state) => ({ hospitalInfo: { ...state.hospitalInfo, ...info } as HospitalType })),
	clearHospitalInfo: () => set({ hospitalInfo: null }),
}));
