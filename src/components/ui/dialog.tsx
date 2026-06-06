"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils/cn";

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
	return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
	return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
	return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
	return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
	className,
	children,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
	return (
		<DialogPrimitive.Overlay
			data-slot="dialog-overlay"
			className={cn(
				"fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/50 p-6",
				"data-[state=open]:animate-in data-[state=closed]:animate-out",
				"animation-duration-200 data-[state=closed]:animation-duration-100 ease-[cubic-bezier(0.23,1,0.32,1)] data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 motion-reduce:animate-none",
				className,
			)}
			{...props}
		>
			{children}
		</DialogPrimitive.Overlay>
	);
}

function DialogContent({
	className,
	children,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
	return (
		<DialogPortal>
			<DialogOverlay>
				<DialogPrimitive.Content
					data-slot="dialog-content"
					className={cn(
						"w-full max-w-[37.5rem]",
						"bg-background rounded-3xl border shadow-[0_2rem_2rem_-1.25rem_rgba(0,0,0,0.25)]",
						"data-[state=open]:animate-in data-[state=closed]:animate-out",
						"animation-duration-200 data-[state=closed]:animation-duration-100 ease-[cubic-bezier(0.23,1,0.32,1)] data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 motion-reduce:animate-none",
						"data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
						className,
					)}
					{...props}
				>
					{children}
				</DialogPrimitive.Content>
			</DialogOverlay>
		</DialogPortal>
	);
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="dialog-header"
			className={cn("flex items-center justify-between", className)}
			{...props}
		/>
	);
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="dialog-footer"
			className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-between p-5", className)}
			{...props}
		/>
	);
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
	return (
		<DialogPrimitive.Title
			data-slot="dialog-title"
			className={cn("text-lg leading-none font-semibold", className)}
			{...props}
		/>
	);
}

function DialogDescription({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
	return (
		<DialogPrimitive.Description
			data-slot="dialog-description"
			className={cn("text-muted-foreground", className)}
			{...props}
		/>
	);
}

export {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
};
