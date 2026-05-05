import { PatientTransferDataByPatientId } from "@/features/transfers/types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type PatientTransferDataStore = {
	patientTransferData: PatientTransferDataByPatientId;
	setPatientTransferData: (patientTransferData: PatientTransferDataByPatientId) => void;
	removePatientTransferData: (patientId: string) => void;
	clearPatientTransferData: () => void;
	setHydrated: () => void;
	isHydrated: boolean;
};

const usePatientTransferDataStore = create<PatientTransferDataStore>()(
	persist(
		(set) => ({
			patientTransferData: {},
			isHydrated: false,
			setPatientTransferData: (patientTransferData) => set({ patientTransferData }),
			removePatientTransferData: (patientId) =>
				set((state) => {
					const nextPatientTransferData = { ...state.patientTransferData };
					delete nextPatientTransferData[patientId];
					return { patientTransferData: nextPatientTransferData };
				}),
			clearPatientTransferData: () => set({ patientTransferData: {} }),
			setHydrated: () => set({ isHydrated: true }),
		}),
		{
			name: "patient-transfer-data",
			storage: createJSONStorage(() => localStorage),
			onRehydrateStorage: () => (state) => {
				if (!state?.patientTransferData) {
					state?.setPatientTransferData({});
				}
				state?.setHydrated();
			},
		},
	),
);

export const usePatientTransferData = () => {
	const patientTransferData = usePatientTransferDataStore((state) => state.patientTransferData);
	const setPatientTransferData = usePatientTransferDataStore(
		(state) => state.setPatientTransferData,
	);
	const removePatientTransferData = usePatientTransferDataStore(
		(state) => state.removePatientTransferData,
	);
	const clearPatientTransferData = usePatientTransferDataStore(
		(state) => state.clearPatientTransferData,
	);
	const isHydrated = usePatientTransferDataStore((state) => state.isHydrated);

	return {
		patientTransferData,
		setPatientTransferData,
		removePatientTransferData,
		clearPatientTransferData,
		isHydrated,
	};
};
