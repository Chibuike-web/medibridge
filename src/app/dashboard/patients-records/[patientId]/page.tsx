import { Suspense } from "react";
import { RiArrowLeftLine, RiArrowRightSLine } from "@remixicon/react";
import { patients } from "@/features/transfers/data";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils/get-initials";
import { StatusBadge } from "@/components/status-badge";
import { CopyIdButton } from "@/components/copy-id-button";
import { SectionTabs } from "./section-tabs";

export default function PatientPage({
	searchParams,
	params,
}: {
	searchParams: Promise<{ section: string }>;
	params: Promise<{ patientId: string }>;
}) {
	return (
		<div>
			<div>
				<nav
					aria-label="Breadcrumb"
					className="flex items-center gap-2 border-b border-gray-200 px-6 py-5"
				>
					<Link href="/dashboard/patients-records" className="flex items-center gap-2 shrink-0">
						<RiArrowLeftLine aria-hidden="true" /> <span>Patient Record</span>
					</Link>
					<RiArrowRightSLine aria-hidden="true" />
					<Suspense>
						<BreadCrumb searchParams={searchParams} params={params} />
					</Suspense>
				</nav>
				<Suspense>
					<Header params={params} />
				</Suspense>
			</div>
			<Suspense>
				<Main searchParams={searchParams} params={params} />
			</Suspense>
		</div>
	);
}

async function BreadCrumb({
	searchParams,
	params,
}: {
	searchParams: Promise<{ section: string }>;
	params: Promise<{ patientId: string }>;
}) {
	const [{ section }, { patientId }] = await Promise.all([searchParams, params]);

	const patientName = patients.find((p) => p.patientId === patientId)?.name;

	return (
		<>
			<span className="shrink-0">{patientName}</span>
			<RiArrowRightSLine aria-hidden="true" />
			<span className="font-semibold shrink-0">{formatSectionLabel(section)}</span>
		</>
	);
}

async function Header({ params }: { params: Promise<{ patientId: string }> }) {
	const { patientId } = await params;
	const patientName = patients.find((p) => p.patientId === patientId)?.name;
	return (
		<div className="flex items-center gap-3 border-b border-gray-200 px-6 py-3.5 text-sm">
			<Avatar className="size-16 border border-gray-200 bg-gray-100 text-gray-700">
				<AvatarFallback className="bg-gray-100 text-2xl font-semibold text-gray-700">
					{getInitials(patientName ?? "")}
				</AvatarFallback>
			</Avatar>

			<div className="flex flex-col gap-4">
				<div className="flex items-center gap-[10px]">
					<h1 className="text-xl font-semibold">{patientName}</h1>
					<StatusBadge status="Active" />
				</div>
				<div className="flex items-center gap-4">
					<div className="flex items-center shrink-0 gap-1">
						<span className="text-gray-400">Sex:</span>
						<span className="font-semibold text-gray-600">Male</span>
					</div>
					<div className="flex items-center shrink-0 gap-1">
						<span>Patient ID:</span>
						<CopyIdButton id="PAT-101" />
					</div>

					<div className="flex items-center shrink-0 gap-1">
						<span className="text-gray-400">Email:</span>
						<span className="font-semibold text-gray-600">chibuikemaduabuchi2023@gmail.com</span>
					</div>
					<div className="flex items-center shrink-0 gap-1">
						<span className="text-gray-400">Phone Number:</span>
						<span className="font-semibold text-gray-600">1234567890</span>
					</div>
					<div className="flex items-center shrink-0 gap-1">
						<span className="text-gray-400">Address:</span>
						<span className="font-semibold text-gray-600">
							12 Allen Avenue, Ikeja, Lagos, Nigeria
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

async function Main({
	searchParams,
	params,
}: {
	searchParams: Promise<{ section: string }>;
	params: Promise<{ patientId: string }>;
}) {
	const [{ section }, { patientId }] = await Promise.all([searchParams, params]);
	return (
		<div>
			<Suspense>
				<SectionTabs />
			</Suspense>
			{section}:{patientId}
		</div>
	);
}

function formatSectionLabel(value: string) {
	return value
		.split("-")
		.filter(Boolean)
		.map((word) => word[0].toUpperCase() + word.slice(1))
		.join(" ");
}
