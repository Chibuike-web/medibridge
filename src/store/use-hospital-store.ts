import { HospitalAdminType } from "@/lib/schemas/hospital-admin-schema";
import { HospitalDetailsType } from "@/lib/schemas/hospital-details-schema";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type HospitalType = HospitalAdminType &
	HospitalDetailsType & {
		filename: string;
		mimetype: string;
		size: string;
	};

type HospitalStore = {
	hospitalInfo: HospitalType | null;
	hydrated: boolean;
	setHospitalInfo: (info: Partial<HospitalType>) => void;
	clearHospitalInfo: () => void;
};

export const useHospitalStore = create<HospitalStore>()(
	persist(
		(set) => ({
			hospitalInfo: null,
			hydrated: false,
			setHospitalInfo: (info) =>
				set((state) => ({ hospitalInfo: { ...state.hospitalInfo, ...info } as HospitalType })),
			clearHospitalInfo: () => set({ hospitalInfo: null }),
		}),
		{
			name: "hospitalInfo",
			partialize: (state) => ({ hospitalInfo: state.hospitalInfo }),
			onRehydrateStorage: () => (state) => {
				if (state) state.hydrated = true;
			},
		}
	)
);
