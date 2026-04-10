"use client";

import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

type TransferDetailsDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	transferId: string | null;
};

export function TransferDetailsDrawer({
	open,
	onOpenChange,
	transferId,
}: TransferDetailsDrawerProps) {
	return (
		<Drawer open={open} onOpenChange={onOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-[24px] data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[800px]">
				<DrawerHeader className="border-b border-gray-200 px-6 py-5 text-left">
					<DrawerTitle className="text-lg text-gray-950">Transfer Details</DrawerTitle>
					<DrawerDescription>Showing the ID for the transfer you selected.</DrawerDescription>
				</DrawerHeader>
				<div className="flex flex-1 flex-col gap-3 px-6 py-6">
					<p className="text-sm font-medium text-gray-500">Transfer ID</p>
					<div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-950">
						{transferId ?? "No transfer selected"}
					</div>
				</div>
				<DrawerFooter className="border-t border-gray-200 px-6 py-4">
					<DrawerClose asChild>
						<Button type="button" variant="outline">
							Close
						</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}
