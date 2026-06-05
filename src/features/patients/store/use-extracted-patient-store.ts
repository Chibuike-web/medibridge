import { PatientType } from "@/features/patients/schemas/patient-schema";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type Store = {
	patientData: PatientType | null;
	isHydrated: boolean;
	setPatientData: (data: PatientType) => void;
	setHydrated: () => void;
};

export const useExtractedPatientStore = create<Store>()(
	persist(
		(set) => ({
			patientData: null,
			isHydrated: false,
			setPatientData: (data) => set({ patientData: data }),
			setHydrated: () => set({ isHydrated: true }),
		}),
		{
			name: "extracted-patient-data",
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({ patientData: state.patientData }),
			onRehydrateStorage: () => (state) => {
				if (!state?.patientData) {
					state?.setPatientData([]);
				}
				state?.setHydrated();
			},
		},
	),
);

export const useExtractedPatient = () => {
	const patientData = useExtractedPatientStore((state) => state.patientData);
	const setPatientData = useExtractedPatientStore((state) => state.setPatientData);
	const isHydrated = useExtractedPatientStore((state) => state.isHydrated);

	return { patientData, isHydrated, setPatientData };
};
