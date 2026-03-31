import { PatientDataType } from "@/features/transfers/types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type TransferPatientDataStore = {
	patientData: PatientDataType;
	setPatientData: (patientData: PatientDataType) => void;
	removePatientData: (patientId: string) => void;
	clearPatientData: () => void;
};

const useTransferPatientDataStore = create<TransferPatientDataStore>()(
	persist(
		(set) => ({
			patientData: {},
			setPatientData: (patientData) => set({ patientData }),
			removePatientData: (patientId) =>
				set((state) => {
					const updated = { ...state.patientData };
					delete updated[patientId];
					return { patientData: updated };
				}),
			clearPatientData: () => set({ patientData: {} }),
		}),
		{
			name: "transfer-patient-data",
			storage: createJSONStorage(() => localStorage),
		},
	),
);

export const useTransferPatientData = () => {
	const patientData = useTransferPatientDataStore((state) => state.patientData);
	const setPatientData = useTransferPatientDataStore((state) => state.setPatientData);
	const removePatientData = useTransferPatientDataStore((state) => state.removePatientData);
	const clearPatientData = useTransferPatientDataStore((state) => state.clearPatientData);

	return {
		patientData,
		setPatientData,
		removePatientData,
		clearPatientData,
	};
};
