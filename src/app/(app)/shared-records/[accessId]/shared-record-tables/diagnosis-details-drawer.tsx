"use client";

import { useMediaQuery } from "@/hooks/use-media-query";

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
	DiagnosisDetailsFallback,
	DiagnosisDetailsOverview,
	DiagnosisHistorySection,
	DiagnosisRelatedRecords,
} from "@/features/patients/components/diagnosis-details-drawer";
import type { DiagnosisDetailsType } from "@/features/patients/types";
import { RiCloseLine } from "@remixicon/react";

type SharedDiagnosisDetailsDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	diagnosis: DiagnosisDetailsType | null;
	isLoading: boolean;
};

export function SharedDiagnosisDetailsDrawer({
	open,
	onOpenChange,
	diagnosis,
	isLoading,
}: SharedDiagnosisDetailsDrawerProps) {
	const isMobile = useMediaQuery("(width < 48rem)");
	return (
		<Drawer open={open} onOpenChange={onOpenChange} direction={isMobile ? "bottom" : "right"}>
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[37.5rem] max-w-none data-[vaul-drawer-direction=bottom]:inset-x-4 data-[vaul-drawer-direction=bottom]:bottom-4 data-[vaul-drawer-direction=bottom]:h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-3xl data-[vaul-drawer-direction=bottom]:border">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 text-left">
					<DrawerTitle className="flex-1 leading-[1.2] text-gray-800">
						Diagnosis details
					</DrawerTitle>
					<DrawerClose asChild>
						<Button variant="ghost" size="icon" aria-label="Close diagnosis details">
							<RiCloseLine aria-hidden="true" />
						</Button>
					</DrawerClose>
					<DrawerDescription className="sr-only">
						Showing details for the diagnosis you selected.
					</DrawerDescription>
				</DrawerHeader>

				<div className="min-h-0 overflow-y-auto px-4 py-5 text-sm">
					{isLoading ? (
						<DiagnosisDetailsFallback />
					) : diagnosis ? (
						<div className="flex flex-col gap-12">
							<DiagnosisDetailsOverview diagnosis={diagnosis} />
							<DiagnosisRelatedRecords relatedRecords={diagnosis.relatedRecords} />
							<DiagnosisHistorySection history={diagnosis.history} />
						</div>
					) : (
						<div className="rounded-2xl border border-gray-200 p-5 text-gray-500">
							Diagnosis details could not be found.
						</div>
					)}
				</div>
			</DrawerContent>
		</Drawer>
	);
}
