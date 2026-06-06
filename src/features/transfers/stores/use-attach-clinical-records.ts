import { AttachedClinicalRecordsType, ClinicalRecordItem } from "@/features/transfers/types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type AttachClinicalRecordsStore = {
	attachedRecords: AttachedClinicalRecordsType;
	toggleAttachedRecord: (patientId: string, record: ClinicalRecordItem) => void;
	removeAttachedRecords: (patientId: string) => void;
	clearAttachedRecords: () => void;
};

const useAttachClinicalRecordsStore = create<AttachClinicalRecordsStore>()(
	persist(
		(set) => ({
			attachedRecords: {},
			toggleAttachedRecord: (patientId, record) =>
				set((state) => {
					const currentRecords = state.attachedRecords[patientId] ?? [];
					const isAttached = currentRecords.some((item) => item.id === record.id);
					const nextRecords = isAttached
						? currentRecords.filter((item) => item.id !== record.id)
						: [...currentRecords, record];

					return {
						attachedRecords: {
							...state.attachedRecords,
							[patientId]: nextRecords,
						},
					};
				}),
			removeAttachedRecords: (patientId) =>
				set((state) => {
					const updated = { ...state.attachedRecords };
					delete updated[patientId];
					return { attachedRecords: updated };
				}),
			clearAttachedRecords: () => set({ attachedRecords: {} }),
		}),
		{
			name: "attached-clinical-records",
			storage: createJSONStorage(() => localStorage),
		},
	),
);

export const useAttachClinicalRecords = () => {
	const attachedRecords = useAttachClinicalRecordsStore((state) => state.attachedRecords);
	const toggleAttachedRecord = useAttachClinicalRecordsStore((state) => state.toggleAttachedRecord);
	const removeAttachedRecords = useAttachClinicalRecordsStore(
		(state) => state.removeAttachedRecords,
	);
	const clearAttachedRecords = useAttachClinicalRecordsStore((state) => state.clearAttachedRecords);

	return {
		attachedRecords,
		toggleAttachedRecord,
		removeAttachedRecords,
		clearAttachedRecords,
	};
};
