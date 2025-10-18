import { PatientType } from "@/lib/schemas/patient-schema";
import { create } from "zustand";

type Store = {
	patientData: PatientType | null;
	setPatientData: (data: PatientType) => void;
};

const useParsedPatientStore = create<Store>((set) => ({
	patientData: null,
	setPatientData: (data) => set({ patientData: data }),
}));

export const useParsedPatient = () => {
	const patientData = useParsedPatientStore((state) => state.patientData);
	const setPatientData = useParsedPatientStore((state) => state.setPatientData);

	return { patientData, setPatientData };
};
