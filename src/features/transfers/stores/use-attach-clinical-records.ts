import { AttachedClinicalRecordsType, ClinicalRecordItem } from "@/features/transfers/types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type AttachClinicalRecordsStore = {
	attachedClinicalRecordsByPatientId: AttachedClinicalRecordsType;
	toggleAttachedClinicalRecordForPatient: (patientId: string, record: ClinicalRecordItem) => void;
	removeAttachedClinicalRecordsForPatient: (patientId: string) => void;
	clearAttachedClinicalRecords: () => void;
};

const useAttachClinicalRecordsStore = create<AttachClinicalRecordsStore>()(
	persist(
		(set) => ({
			attachedClinicalRecordsByPatientId: {},
			toggleAttachedClinicalRecordForPatient: (patientId, record) =>
				set((state) => {
					const currentRecords = state.attachedClinicalRecordsByPatientId[patientId] ?? [];
					const isAttached = currentRecords.some((item) => item.id === record.id);
					const nextRecords = isAttached
						? currentRecords.filter((item) => item.id !== record.id)
						: [...currentRecords, record];

					return {
						attachedClinicalRecordsByPatientId: {
							...state.attachedClinicalRecordsByPatientId,
							[patientId]: nextRecords,
						},
					};
				}),
			removeAttachedClinicalRecordsForPatient: (patientId) =>
				set((state) => {
					const nextAttachedClinicalRecordsByPatientId = {
						...state.attachedClinicalRecordsByPatientId,
					};
					delete nextAttachedClinicalRecordsByPatientId[patientId];
					return {
						attachedClinicalRecordsByPatientId: nextAttachedClinicalRecordsByPatientId,
					};
				}),
			clearAttachedClinicalRecords: () => set({ attachedClinicalRecordsByPatientId: {} }),
		}),
		{
			name: "attached-clinical-records",
			storage: createJSONStorage(() => localStorage),
			version: 2,
			migrate: () => ({ attachedClinicalRecordsByPatientId: {} }),
		},
	),
);

export const useAttachClinicalRecords = () => {
	const attachedClinicalRecordsByPatientId = useAttachClinicalRecordsStore(
		(state) => state.attachedClinicalRecordsByPatientId,
	);
	const toggleAttachedClinicalRecordForPatient = useAttachClinicalRecordsStore(
		(state) => state.toggleAttachedClinicalRecordForPatient,
	);
	const removeAttachedClinicalRecordsForPatient = useAttachClinicalRecordsStore(
		(state) => state.removeAttachedClinicalRecordsForPatient,
	);
	const clearAttachedClinicalRecords = useAttachClinicalRecordsStore((state) => state.clearAttachedClinicalRecords);

	return {
		attachedClinicalRecordsByPatientId,
		toggleAttachedClinicalRecordForPatient,
		removeAttachedClinicalRecordsForPatient,
		clearAttachedClinicalRecords,
	};
};
