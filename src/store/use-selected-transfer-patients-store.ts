import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type SelectedTransferPatient = {
	name: string;
	patientId: string;
};

type SelectedTransferPatientsStore = {
	selectedPatients: SelectedTransferPatient[];
	addSelectedPatient: (patient: SelectedTransferPatient) => void;
	removeSelectedPatient: (patient: SelectedTransferPatient) => void;
	toggleSelectedPatient: (patient: SelectedTransferPatient) => void;
	clearSelectedPatients: () => void;
};

const useSelectedTransferPatientsStore = create<SelectedTransferPatientsStore>()(
	persist(
		(set, get) => ({
			selectedPatients: [],
			addSelectedPatient: (patient) =>
				set((state) => {
					const isSelected = state.selectedPatients.some(
						(item) => item.patientId === patient.patientId && item.name === patient.name,
					);

					if (isSelected) return state;

					return { selectedPatients: [...state.selectedPatients, patient] };
				}),
			removeSelectedPatient: (patient) =>
				set((state) => ({
					selectedPatients: state.selectedPatients.filter(
						(item) => !(item.patientId === patient.patientId && item.name === patient.name),
					),
				})),
			toggleSelectedPatient: (patient) => {
				const { selectedPatients, addSelectedPatient, removeSelectedPatient } = get();
				const isSelected = selectedPatients.some(
					(item) => item.patientId === patient.patientId && item.name === patient.name,
				);

				if (isSelected) {
					removeSelectedPatient(patient);
					return;
				}

				addSelectedPatient(patient);
			},
			clearSelectedPatients: () => set({ selectedPatients: [] }),
		}),
		{
			name: "selected-transfer-patients",
			storage: createJSONStorage(() => localStorage),
		},
	),
);

export const useSelectedTransferPatients = () => {
	const selectedPatients = useSelectedTransferPatientsStore((state) => state.selectedPatients);
	const addSelectedPatient = useSelectedTransferPatientsStore((state) => state.addSelectedPatient);
	const removeSelectedPatient = useSelectedTransferPatientsStore(
		(state) => state.removeSelectedPatient,
	);
	const toggleSelectedPatient = useSelectedTransferPatientsStore(
		(state) => state.toggleSelectedPatient,
	);
	const clearSelectedPatients = useSelectedTransferPatientsStore(
		(state) => state.clearSelectedPatients,
	);

	return {
		selectedPatients,
		addSelectedPatient,
		removeSelectedPatient,
		toggleSelectedPatient,
		clearSelectedPatients,
	};
};
