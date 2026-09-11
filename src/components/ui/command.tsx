"use client";

import { Command as CommandPrimitive } from "cmdk";
import * as React from "react";
import { cn } from "@/lib/utils/cn";

const Command = ({
	className,
	ref,
	...props
}: React.ComponentPropsWithRef<typeof CommandPrimitive>) => (
	<CommandPrimitive
		ref={ref}
		className={cn("flex h-full w-full flex-col overflow-hidden bg-white text-gray-800", className)}
		{...props}
	/>
);
Command.displayName = CommandPrimitive.displayName;

const CommandInput = ({
	className,
	ref,
	...props
}: React.ComponentPropsWithRef<typeof CommandPrimitive.Input>) => (
	<div className="flex h-full flex-1 items-center">
		<CommandPrimitive.Input
			ref={ref}
			className={cn(
				"h-full w-full bg-transparent text-sm font-medium text-gray-600 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			{...props}
		/>
	</div>
);
CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = ({
	className,
	ref,
	...props
}: React.ComponentPropsWithRef<typeof CommandPrimitive.List>) => (
	<CommandPrimitive.List
		ref={ref}
		className={cn("max-h-[18.75rem] overflow-y-auto overflow-x-hidden", className)}
		{...props}
	/>
);
CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = ({
	className,
	ref,
	...props
}: React.ComponentPropsWithRef<typeof CommandPrimitive.Empty>) => (
	<CommandPrimitive.Empty
		ref={ref}
		className={cn("py-12 text-center text-sm text-gray-400", className)}
		{...props}
	/>
);
CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = ({
	className,
	ref,
	...props
}: React.ComponentPropsWithRef<typeof CommandPrimitive.Group>) => (
	<CommandPrimitive.Group
		ref={ref}
		className={cn(
			"overflow-hidden p-2 text-gray-800 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-sm [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-gray-400",
			className,
		)}
		{...props}
	/>
);
CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandItem = ({
	className,
	ref,
	...props
}: React.ComponentPropsWithRef<typeof CommandPrimitive.Item>) => (
	<CommandPrimitive.Item
		ref={ref}
		className={cn(
			"flex cursor-default select-none items-center gap-3 rounded-lg px-3 py-3 text-sm outline-none focus-visible:outline-none focus-visible:ring-0 aria-selected:bg-gray-100 aria-selected:text-gray-800",
			className,
		)}
		{...props}
	/>
);
CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandDialog = ({
	className,
	contentClassName,
	overlayClassName,
	ref,
	...props
}: React.ComponentPropsWithRef<typeof CommandPrimitive.Dialog>) => (
	<CommandPrimitive.Dialog
		ref={ref}
		className={cn("flex h-full w-full flex-col overflow-hidden bg-white text-gray-800", className)}
		contentClassName={cn(
			"fixed inset-x-0 bottom-0 z-50 h-auto max-h-[80vh] w-full rounded-t-lg rounded-b-none border border-x-0 border-b-0 bg-background shadow-[0_2rem_2rem_-1.25rem_rgba(0,0,0,0.25)]",
			"md:top-1/2 md:right-auto md:bottom-auto md:left-1/2 md:max-h-none md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl md:border-x md:border-b",
			"data-[state=open]:animate-in data-[state=closed]:animate-out",
			"animation-duration-200 data-[state=closed]:animation-duration-100 ease-[cubic-bezier(0.23,1,0.32,1)] data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 motion-reduce:animate-none",
			"data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
			contentClassName,
		)}
		overlayClassName={cn(
			"fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-gray-800/50 p-6",
			"data-[state=open]:animate-in data-[state=closed]:animate-out",
			"animation-duration-200 data-[state=closed]:animation-duration-100 ease-[cubic-bezier(0.23,1,0.32,1)] data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0 motion-reduce:animate-none backdrop-blur-[0.25rem]",
			overlayClassName,
		)}
		{...props}
	/>
);
CommandDialog.displayName = CommandPrimitive.Dialog.displayName;

export {
	Command,
	CommandDialog,
	CommandInput,
	CommandList,
	CommandEmpty,
	CommandGroup,
	CommandItem,
};
