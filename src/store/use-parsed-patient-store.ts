import { PatientType } from "@/lib/schemas/patient-schema";
import { create } from "zustand";

type Store = {
	data: PatientType | null;
	setData: (data: PatientType) => void;
};

const useParsedPatientStore = create<Store>((set) => ({
	data: null,
	setData: (data) => set({ data }),
}));

export const useParsedPatient = () => {
	const data = useParsedPatientStore((state) => state.data);
	const setData = useParsedPatientStore((state) => state.setData);

	return { data, setData };
};
