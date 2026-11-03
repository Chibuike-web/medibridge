"use client";

import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import {
	MedicationDetailsFallback,
	MedicationDetailsOverview,
	MedicationHistorySection,
} from "@/features/patients/components/medication-details-drawer";
import type { MedicationDetailsType } from "@/features/patients/types";
import { RiCloseLine } from "@remixicon/react";

type SharedMedicationDetailsDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	medication: MedicationDetailsType | null;
	isLoading: boolean;
};

export function SharedMedicationDetailsDrawer({
	open,
	onOpenChange,
	medication,
	isLoading,
}: SharedMedicationDetailsDrawerProps) {
	return (
		<Drawer open={open} onOpenChange={onOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[37.5rem]">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 text-left">
					<DrawerTitle className="flex-1 leading-[1.2] text-gray-800">
						Medication details
					</DrawerTitle>
					<DrawerClose asChild>
						<Button variant="ghost" size="icon" aria-label="Close medication details">
							<RiCloseLine aria-hidden="true" />
						</Button>
					</DrawerClose>
					<DrawerDescription className="sr-only">
						Showing details for the medication you selected.
					</DrawerDescription>
				</DrawerHeader>

				<div className="min-h-0 overflow-y-auto px-4 py-5 text-sm">
					{isLoading ? (
						<MedicationDetailsFallback />
					) : medication ? (
						<div className="flex flex-col gap-10">
							<MedicationDetailsOverview medication={medication} />
							<MedicationHistorySection history={medication.history} />
						</div>
					) : (
						<div className="rounded-2xl border border-gray-200 p-5 text-gray-500">
							Medication details could not be found.
						</div>
					)}
				</div>
			</DrawerContent>
		</Drawer>
	);
}
