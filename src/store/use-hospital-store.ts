import { HospitalAdminType } from "@/lib/schemas/hospital-admin-schema";
import { HospitalDetailsType } from "@/lib/schemas/hospital-details-schema";
import { create } from "zustand";

export type HospitalType = HospitalAdminType &
	HospitalDetailsType & {
		filename: string;
		mimetype: string;
		size: string;
	};

type HospitalStore = {
	hospitalInfo: HospitalType | null;
	setHospitalInfo: (info: Partial<HospitalType | HospitalAdminType>) => void;
	clearHospitalInfo: () => void;
};

export const useHospitalStore = create<HospitalStore>((set) => ({
	hospitalInfo: null,
	setHospitalInfo: (info) =>
		set((state) => ({ hospitalInfo: { ...state.hospitalInfo, ...info } as HospitalType })),
	clearHospitalInfo: () => set({ hospitalInfo: null }),
}));
