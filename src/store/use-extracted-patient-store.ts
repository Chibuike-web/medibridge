import { PatientType } from "@/app/(auth)/schemas/patient-schema";
import { create } from "zustand";

type Store = {
	patientData: PatientType | null;
	setPatientData: (data: PatientType) => void;
};

const useExtractedPatientStore = create<Store>((set) => ({
	patientData: null,
	setPatientData: (data) => set({ patientData: data }),
}));

export const useExtractedPatient = () => {
	const patientData = useExtractedPatientStore((state) => state.patientData);
	const setPatientData = useExtractedPatientStore((state) => state.setPatientData);

	return { patientData, setPatientData };
};
