import { PatientTransferDataByPatientId } from "@/features/transfers/types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type PatientTransferDataStore = {
	patientTransferDataByPatientId: PatientTransferDataByPatientId;
	setPatientTransferDataByPatientId: (
		patientTransferDataByPatientId: PatientTransferDataByPatientId,
	) => void;
	removePatientTransferDataByPatientId: (patientId: string) => void;
	clearPatientTransferDataByPatientId: () => void;
	setHydrated: () => void;
	isPatientTransferDataHydrated: boolean;
};

const usePatientTransferDataStore = create<PatientTransferDataStore>()(
	persist(
		(set) => ({
			patientTransferDataByPatientId: {},
			isPatientTransferDataHydrated: false,
			setPatientTransferDataByPatientId: (patientTransferDataByPatientId) =>
				set({ patientTransferDataByPatientId }),
			removePatientTransferDataByPatientId: (patientId) =>
				set((state) => {
					const nextPatientTransferDataByPatientId = {
						...state.patientTransferDataByPatientId,
					};
					delete nextPatientTransferDataByPatientId[patientId];
					return { patientTransferDataByPatientId: nextPatientTransferDataByPatientId };
				}),
			clearPatientTransferDataByPatientId: () => set({ patientTransferDataByPatientId: {} }),
			setHydrated: () => set({ isPatientTransferDataHydrated: true }),
		}),
		{
			name: "patient-transfer-data",
			storage: createJSONStorage(() => localStorage),
			onRehydrateStorage: () => (state) => {
				if (!state?.patientTransferDataByPatientId) {
					state?.setPatientTransferDataByPatientId({});
				}
				state?.setHydrated();
			},
		},
	),
);

export const usePatientTransferData = () => {
	const patientTransferDataByPatientId = usePatientTransferDataStore(
		(state) => state.patientTransferDataByPatientId,
	);
	const setPatientTransferDataByPatientId = usePatientTransferDataStore(
		(state) => state.setPatientTransferDataByPatientId,
	);
	const removePatientTransferDataByPatientId = usePatientTransferDataStore(
		(state) => state.removePatientTransferDataByPatientId,
	);
	const clearPatientTransferDataByPatientId = usePatientTransferDataStore(
		(state) => state.clearPatientTransferDataByPatientId,
	);
	const isPatientTransferDataHydrated = usePatientTransferDataStore(
		(state) => state.isPatientTransferDataHydrated,
	);

	return {
		patientTransferDataByPatientId,
		setPatientTransferDataByPatientId,
		removePatientTransferDataByPatientId,
		clearPatientTransferDataByPatientId,
		isPatientTransferDataHydrated,
	};
};
