import { PatientType } from "@/app/api/extract-file/schemas/patient-schema";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type Store = {
	patientData: PatientType | null;
	setPatientData: (data: PatientType) => void;
};

export const useExtractedPatientStore = create<Store>()(
	persist(
		(set) => ({
			patientData: null,
			setPatientData: (data) => set({ patientData: data }),
		}),
		{
			name: "extracted-patient-data",
			storage: createJSONStorage(() => localStorage),
		}
	)
);

export const useExtractedPatient = () => {
	const patientData = useExtractedPatientStore((state) => state.patientData);
	const setPatientData = useExtractedPatientStore((state) => state.setPatientData);

	return { patientData, setPatientData };
};
