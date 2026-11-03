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
	ProcedureDetailsFallback,
	ProcedureDetailsOverview,
	ProcedureHistorySection,
	ProcedureRelatedRecords,
} from "@/features/patients/components/procedure-details-drawer";
import type { ProcedureDetailsType } from "@/features/patients/types";
import { RiCloseLine } from "@remixicon/react";

type SharedProcedureDetailsDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	procedure: ProcedureDetailsType | null;
	isLoading: boolean;
};

export function SharedProcedureDetailsDrawer({
	open,
	onOpenChange,
	procedure,
	isLoading,
}: SharedProcedureDetailsDrawerProps) {
	return (
		<Drawer open={open} onOpenChange={onOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[37.5rem]">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 text-left">
					<DrawerTitle className="flex-1 leading-[1.2] text-gray-800">
						Procedure details
					</DrawerTitle>
					<DrawerClose asChild>
						<Button variant="ghost" size="icon" aria-label="Close procedure details">
							<RiCloseLine aria-hidden="true" />
						</Button>
					</DrawerClose>
					<DrawerDescription className="sr-only">
						Showing details for the procedure you selected.
					</DrawerDescription>
				</DrawerHeader>

				<div className="min-h-0 overflow-y-auto px-4 py-5 text-sm">
					{isLoading ? (
						<ProcedureDetailsFallback />
					) : procedure ? (
						<div className="flex flex-col gap-10">
							<ProcedureDetailsOverview procedure={procedure} />
							<ProcedureRelatedRecords relatedRecords={procedure.relatedRecords} />
							<ProcedureHistorySection history={procedure.history} />
						</div>
					) : (
						<div className="rounded-2xl border border-gray-200 p-5 text-gray-500">
							Procedure details could not be found.
						</div>
					)}
				</div>
			</DrawerContent>
		</Drawer>
	);
}
