"use client";

import { useIsBelowMd } from "@/hooks/use-is-below-md";

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
	AllergyDetailsFallback,
	AllergyDetailsOverview,
	AllergyHistorySection,
} from "@/features/patients/components/allergy-details-drawer";
import type { AllergyDetailsType } from "@/features/patients/types";
import { RiCloseLine } from "@remixicon/react";

type SharedAllergyDetailsDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	allergy: AllergyDetailsType | null;
	isLoading: boolean;
};

export function SharedAllergyDetailsDrawer({
	open,
	onOpenChange,
	allergy,
	isLoading,
}: SharedAllergyDetailsDrawerProps) {
	const isBelowMd = useIsBelowMd();
	return (
		<Drawer open={open} onOpenChange={onOpenChange} direction={isBelowMd ? "bottom" : "right"}>
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[37.5rem] max-w-none data-[vaul-drawer-direction=bottom]:inset-x-4 data-[vaul-drawer-direction=bottom]:bottom-4 data-[vaul-drawer-direction=bottom]:h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-3xl data-[vaul-drawer-direction=bottom]:border">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 text-left">
					<DrawerTitle className="flex-1 leading-[1.2] text-gray-800">Allergy details</DrawerTitle>
					<DrawerClose asChild>
						<Button variant="ghost" size="icon" aria-label="Close allergy details">
							<RiCloseLine aria-hidden="true" />
						</Button>
					</DrawerClose>
					<DrawerDescription className="sr-only">
						Showing details for the allergy you selected.
					</DrawerDescription>
				</DrawerHeader>

				<div className="min-h-0 overflow-y-auto px-4 py-5 text-sm">
					{isLoading ? (
						<AllergyDetailsFallback />
					) : allergy ? (
						<div className="flex flex-col gap-10">
							<AllergyDetailsOverview allergy={allergy} />
							<AllergyHistorySection history={allergy.history} />
						</div>
					) : (
						<div className="rounded-2xl border border-gray-200 p-5 text-gray-500">
							Allergy details could not be found.
						</div>
					)}
				</div>
			</DrawerContent>
		</Drawer>
	);
}
