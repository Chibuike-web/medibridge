import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type SelectedTransferPatient = {
	name: string;
	patientId: string;
};

type SelectedTransferPatientsStore = {
	selectedTransferPatients: SelectedTransferPatient[];
	addSelectedTransferPatient: (patient: SelectedTransferPatient) => void;
	removeSelectedTransferPatient: (patient: SelectedTransferPatient) => void;
	toggleSelectedTransferPatient: (patient: SelectedTransferPatient) => void;
	clearSelectedTransferPatients: () => void;
};

const useSelectedTransferPatientsStore = create<SelectedTransferPatientsStore>()(
	persist(
		(set, get) => ({
			selectedTransferPatients: [],
			addSelectedTransferPatient: (patient) =>
				set((state) => {
					const isSelected = state.selectedTransferPatients.some(
						(item) => item.patientId === patient.patientId && item.name === patient.name,
					);

					if (isSelected) return state;

					return { selectedTransferPatients: [...state.selectedTransferPatients, patient] };
				}),
			removeSelectedTransferPatient: (patient) =>
				set((state) => ({
					selectedTransferPatients: state.selectedTransferPatients.filter(
						(item) => !(item.patientId === patient.patientId && item.name === patient.name),
					),
				})),
			toggleSelectedTransferPatient: (patient) => {
				const {
					selectedTransferPatients,
					addSelectedTransferPatient,
					removeSelectedTransferPatient,
				} = get();
				const isSelected = selectedTransferPatients.some(
					(item) => item.patientId === patient.patientId && item.name === patient.name,
				);

				if (isSelected) {
					removeSelectedTransferPatient(patient);
					return;
				}

				addSelectedTransferPatient(patient);
			},
			clearSelectedTransferPatients: () => set({ selectedTransferPatients: [] }),
		}),
		{
			name: "selected-transfer-patients",
			storage: createJSONStorage(() => localStorage),
		},
	),
);

export const useSelectedTransferPatients = () => {
	const selectedTransferPatients = useSelectedTransferPatientsStore(
		(state) => state.selectedTransferPatients,
	);
	const addSelectedTransferPatient = useSelectedTransferPatientsStore(
		(state) => state.addSelectedTransferPatient,
	);
	const removeSelectedTransferPatient = useSelectedTransferPatientsStore(
		(state) => state.removeSelectedTransferPatient,
	);
	const toggleSelectedTransferPatient = useSelectedTransferPatientsStore(
		(state) => state.toggleSelectedTransferPatient,
	);
	const clearSelectedTransferPatients = useSelectedTransferPatientsStore(
		(state) => state.clearSelectedTransferPatients,
	);

	return {
		selectedTransferPatients,
		addSelectedTransferPatient,
		removeSelectedTransferPatient,
		toggleSelectedTransferPatient,
		clearSelectedTransferPatients,
	};
};
