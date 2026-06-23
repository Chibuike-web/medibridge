"use client";

import { CopyIdButton } from "@/components/copy-id-button";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import type {
	DiagnosisDetailsHistoryEvent,
	DiagnosisDetailsRelatedRecord,
	DiagnosisDetailsType,
} from "@/features/patients/types";
import { cn } from "@/lib/utils/cn";
import { RiArrowDownSLine, RiCloseLine, RiEditLine } from "@remixicon/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useState } from "react";

type DiagnosisDetailsDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	diagnosis: DiagnosisDetailsType | null;
	isLoading: boolean;
};

const EMPTY_VALUE = "-";

export function DiagnosisDetailsDrawer({
	open,
	onOpenChange,
	diagnosis,
	isLoading,
}: DiagnosisDetailsDrawerProps) {
	return (
		<Drawer open={open} onOpenChange={onOpenChange} direction="right">
			<DrawerContent className="overflow-hidden rounded-3xl text-sm data-[vaul-drawer-direction=right]:top-4 data-[vaul-drawer-direction=right]:right-4 data-[vaul-drawer-direction=right]:bottom-4 data-[vaul-drawer-direction=right]:h-auto data-[vaul-drawer-direction=right]:w-[50rem]">
				<DrawerHeader className="flex-row items-center justify-between border-b border-gray-200 px-6 py-5 text-left">
					<DrawerTitle className="text-lg leading-[1.2] text-gray-800">
						View diagnosis details
					</DrawerTitle>
					<DrawerClose aria-label="Close diagnosis details">
						<RiCloseLine className="size-5" aria-hidden="true" />
					</DrawerClose>
					<DrawerDescription className="sr-only">
						Showing details for the diagnosis you selected.
					</DrawerDescription>
				</DrawerHeader>

				<div className="min-h-0 overflow-y-auto px-6 py-8 text-sm">
					{isLoading ? (
						<DiagnosisDetailsFallback />
					) : diagnosis ? (
						<div className="flex flex-col gap-10">
							<DiagnosisDetailsOverview diagnosis={diagnosis} />
							<DiagnosisHistorySection history={diagnosis.history} />
							<DiagnosisRelatedRecords relatedRecords={diagnosis.relatedRecords} />
						</div>
					) : (
						<div className="rounded-2xl border border-gray-200 p-5 text-gray-500">
							Diagnosis details could not be found.
						</div>
					)}
				</div>

				<DrawerFooter className="border-t border-gray-200 px-6 py-5 text-sm">
					<div className="flex flex-col gap-x-4 gap-y-2 lg:flex-row lg:self-end">
						<DrawerClose asChild>
							<Button variant="outline" className="text-sm">
								Cancel
							</Button>
						</DrawerClose>
						<Button className="bg-gray-800 text-sm">Archive diagnosis</Button>
					</div>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

function DiagnosisDetailsOverview({ diagnosis }: { diagnosis: DiagnosisDetailsType }) {
	return (
		<div className="flex flex-col gap-10">
			<div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-nowrap">
				<div className="flex items-center gap-2">
					<span className="text-gray-400">Diagnosis ID:</span>
					<CopyIdButton id={diagnosis.diagnosisId} className="text-sm" />
				</div>
				<div className="flex items-center gap-2">
					{diagnosis.encounterId ? (
						<>
							<span className="text-gray-400">Encounter ID:</span>
							<CopyIdButton id={diagnosis.encounterId} className="text-sm" />
						</>
					) : null}
				</div>
			</div>

			<div className="flex flex-col gap-6">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<h2 className="text-xl font-semibold text-gray-800">{diagnosis.name}</h2>
						<StatusBadge status={diagnosis.status} />
					</div>
					<button
						type="button"
						className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 transition hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
					>
						<RiEditLine className="size-4" aria-hidden="true" />
						Edit
					</button>
				</div>

				<div className="grid grid-cols-1 gap-x-16 gap-y-6 sm:grid-cols-2">
					<DiagnosisDetailItem label="Severity/Stage" value={diagnosis.severityStage} />
					<DiagnosisDetailItem label="Diagnosed at" value={diagnosis.diagnosedAt} />
					<DiagnosisDetailItem label="Created at" value={diagnosis.createdAt} />
					<DiagnosisDetailItem label="Diagnosed by" value={diagnosis.diagnosedBy} />
					<DiagnosisDetailItem label="Updated by" value={diagnosis.updatedBy} />
					<DiagnosisDetailItem label="Updated At" value={diagnosis.updatedAt} />
					<DiagnosisDetailItem label="Last reviewed" value={diagnosis.lastReviewedAt} />
					<DiagnosisDetailItem label="Clinical note" value={diagnosis.clinicalNote} />
				</div>
			</div>
		</div>
	);
}

function DiagnosisDetailItem({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col gap-2">
			<span className="text-gray-400">{label}</span>
			{label === "Status" ? (
				<StatusBadge status={value || EMPTY_VALUE} className="w-max" />
			) : (
				<span className="font-semibold text-gray-600">{value || EMPTY_VALUE}</span>
			)}
		</div>
	);
}

function DiagnosisHistorySection({ history }: { history: DiagnosisDetailsHistoryEvent[] }) {
	return (
		<div className="flex flex-col gap-4">
			{history.map((historyEvent) => (
				<DiagnosisHistoryCard key={historyEvent.id} historyEvent={historyEvent} />
			))}
		</div>
	);
}

function DiagnosisHistoryCard({ historyEvent }: { historyEvent: DiagnosisDetailsHistoryEvent }) {
	const [isDiagnosisHistoryExpanded, setIsDiagnosisHistoryExpanded] = useState(true);
	const shouldReduceMotion = useReducedMotion();
	const sectionId = useId();
	const titleId = `${sectionId}-title`;
	const panelId = `${sectionId}-panel`;

	return (
		<section className="flex flex-col rounded-2xl border border-gray-200 p-5">
			<button
				type="button"
				onClick={() => setIsDiagnosisHistoryExpanded((prev) => !prev)}
				aria-expanded={isDiagnosisHistoryExpanded}
				aria-controls={panelId}
				className="flex w-full items-center justify-between gap-4 text-left"
			>
				<div className="flex flex-wrap items-center gap-x-4 gap-y-1">
					<span id={titleId} className="text-base font-semibold text-gray-800">
						{historyEvent.title}
					</span>
					<span className="text-sm text-gray-400">{historyEvent.timestamp}</span>
				</div>
				<RiArrowDownSLine
					className={cn(
						"size-5 shrink-0 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
						isDiagnosisHistoryExpanded ? "rotate-180" : "",
					)}
					aria-hidden="true"
				/>
			</button>
			<AnimatePresence initial={false}>
				{isDiagnosisHistoryExpanded ? (
					<motion.div
						id={panelId}
						initial={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
						animate={shouldReduceMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }}
						exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
						transition={
							shouldReduceMotion
								? { duration: 0.12 }
								: {
										height: { duration: 0.22, ease: [0.23, 1, 0.32, 1] },
										opacity: { duration: 0.16, ease: "easeOut" },
									}
						}
						className="overflow-hidden"
					>
						<div
							aria-labelledby={titleId}
							className="mt-6 grid grid-cols-1 gap-x-16 gap-y-5 sm:grid-cols-2"
						>
							{historyEvent.items.map((item) => (
								<DiagnosisDetailItem
									key={`${historyEvent.id}-${item.label}`}
									label={item.label}
									value={item.value}
								/>
							))}
						</div>
					</motion.div>
				) : null}
			</AnimatePresence>
		</section>
	);
}

function DiagnosisRelatedRecords({
	relatedRecords,
}: {
	relatedRecords: DiagnosisDetailsType["relatedRecords"];
}) {
	const sections = [
		{ title: "Medications", records: relatedRecords.medications },
		{ title: "Lab Tests", records: relatedRecords.labTests },
		{ title: "Imaging", records: relatedRecords.imaging },
		{ title: "Procedures", records: relatedRecords.procedures },
	].filter((section) => section.records.length > 0);

	if (sections.length === 0) {
		return null;
	}

	return (
		<div className="flex flex-col gap-4">
			{sections.map((section) => (
				<DiagnosisRelatedRecordSection
					key={section.title}
					title={section.title}
					records={section.records}
				/>
			))}
		</div>
	);
}

function DiagnosisRelatedRecordSection({
	title,
	records,
}: {
	title: string;
	records: DiagnosisDetailsRelatedRecord[];
}) {
	const [isRelatedRecordSectionExpanded, setIsRelatedRecordSectionExpanded] = useState(true);
	const shouldReduceMotion = useReducedMotion();
	const sectionId = useId();
	const titleId = `${sectionId}-title`;
	const panelId = `${sectionId}-panel`;

	return (
		<section className="flex flex-col rounded-2xl border border-gray-200 p-5">
			<button
				type="button"
				onClick={() => setIsRelatedRecordSectionExpanded((prev) => !prev)}
				aria-expanded={isRelatedRecordSectionExpanded}
				aria-controls={panelId}
				className="flex w-full items-center justify-between gap-4 text-left"
			>
				<span id={titleId} className="text-base font-semibold text-gray-800">
					{title}
				</span>
				<RiArrowDownSLine
					className={cn(
						"size-5 shrink-0 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
						isRelatedRecordSectionExpanded ? "rotate-180" : "",
					)}
					aria-hidden="true"
				/>
			</button>
			<AnimatePresence initial={false}>
				{isRelatedRecordSectionExpanded ? (
					<motion.div
						id={panelId}
						initial={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
						animate={shouldReduceMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }}
						exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
						transition={
							shouldReduceMotion
								? { duration: 0.12 }
								: {
										height: { duration: 0.22, ease: [0.23, 1, 0.32, 1] },
										opacity: { duration: 0.16, ease: "easeOut" },
									}
						}
						className="overflow-hidden"
					>
						<div aria-labelledby={titleId} className="mt-5 flex flex-col gap-4">
							{records.map((record) => (
								<div
									key={record.id}
									className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
								>
									<div className="flex min-w-0 flex-wrap items-center gap-2">
										<span className="min-w-0 truncate font-semibold text-gray-600">
											{record.name}
										</span>
										<StatusBadge status={record.status} className="shrink-0" />
									</div>
									<CopyIdButton id={record.id} className="text-sm" />
								</div>
							))}
						</div>
					</motion.div>
				) : null}
			</AnimatePresence>
		</section>
	);
}

function DiagnosisDetailsFallback() {
	return (
		<div className="flex flex-col gap-8" aria-busy="true" aria-live="polite">
			<div className="flex flex-wrap gap-6">
				<div className="h-6 w-36 animate-pulse rounded-md bg-gray-100" />
				<div className="h-6 w-40 animate-pulse rounded-md bg-gray-100" />
			</div>
			<div className="flex flex-col gap-6">
				<div className="h-7 w-56 animate-pulse rounded-md bg-gray-100" />
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
					{Array.from({ length: 8 }).map((_, index) => (
						<div key={index} className="flex flex-col gap-2">
							<div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
							<div className="h-5 w-44 animate-pulse rounded bg-gray-100" />
						</div>
					))}
				</div>
			</div>
			{Array.from({ length: 2 }).map((_, index) => (
				<div key={index} className="flex flex-col gap-4 rounded-2xl border border-gray-200 p-5">
					<div className="h-5 w-48 animate-pulse rounded bg-gray-100" />
					<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
						<div className="h-5 w-40 animate-pulse rounded bg-gray-100" />
						<div className="h-5 w-36 animate-pulse rounded bg-gray-100" />
					</div>
				</div>
			))}
		</div>
	);
}
