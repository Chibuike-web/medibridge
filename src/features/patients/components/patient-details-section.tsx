import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RiEditLine, RiMore2Fill, RiShareForwardBoxLine } from "@remixicon/react";

export function PatientDetailsSection({ patientId }: { patientId: string }) {
	void patientId;

	return (
		<div className="p-8">
			<div className="mx-auto max-w-7xl">
				<h1 className="mb-6 text-xl font-semibold text-gray-800">Patient Details</h1>
				<div className="flex flex-col gap-10">
					<PersonalInformation />
					<ContactInformation />
					<EmergencyContact />
					<PhysicalInformation />
				</div>
			</div>
		</div>
	);
}

function PersonalInformation() {
	return (
		<section className="rounded-xl bg-gray-50 ring ring-gray-200">
			<div className="flex h-11 items-center justify-between gap-4 px-4">
				<h2 className="font-semibold text-lg text-gray-600 no-line-height">
					Personal Information
				</h2>
				<DropdownMenu>
					<DropdownMenuTrigger
						type="button"
						className="inline-flex size-9 items-center justify-center rounded-md border border-transparent text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
						aria-label="Open actions for Personal Information"
					>
						<RiMore2Fill className="size-5" aria-hidden />
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="w-[13.75rem] rounded-xl border border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
					>
						<DropdownMenuItem className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white">
							<RiEditLine className="text-white" />
							<span>Edit info</span>
						</DropdownMenuItem>
						<DropdownMenuItem className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white">
							<RiShareForwardBoxLine className="text-white" />
							<span>Export info</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-6 rounded-xl bg-white p-4 ring ring-gray-200">
				{personalInformation.map((item) => (
					<div key={item.label} className="flex w-full flex-col gap-4">
						<div className="text-sm font-normal text-gray-400 no-line-height">{item.label}</div>
						<div className="text-sm font-semibold text-gray-600 no-line-height">{item.value}</div>
					</div>
				))}
			</div>
		</section>
	);
}

function ContactInformation() {
	return (
		<section className="rounded-xl bg-gray-50 ring ring-gray-200">
			<div className="flex h-11 items-center justify-between gap-4 px-4">
				<h2 className="font-semibold text-lg text-gray-600 no-line-height">
					Contact Information
				</h2>
				<DropdownMenu>
					<DropdownMenuTrigger
						type="button"
						className="inline-flex size-9 items-center justify-center rounded-md border border-transparent text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
						aria-label="Open actions for Contact Information"
					>
						<RiMore2Fill className="size-5" aria-hidden />
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="w-[13.75rem] rounded-xl border border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
					>
						<DropdownMenuItem className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white">
							<RiEditLine className="text-white" />
							<span>Edit info</span>
						</DropdownMenuItem>
						<DropdownMenuItem className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white">
							<RiShareForwardBoxLine className="text-white" />
							<span>Export info</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-6 rounded-xl bg-white p-4 ring ring-gray-200">
				{contactInformation.map((item) => (
					<div key={item.label} className="flex w-full flex-col gap-4">
						<div className="text-sm font-normal text-gray-400 no-line-height">{item.label}</div>
						<div className="text-sm font-semibold text-gray-600 no-line-height">{item.value}</div>
					</div>
				))}
			</div>
		</section>
	);
}

function EmergencyContact() {
	return (
		<section className="rounded-xl bg-gray-50 ring ring-gray-200">
			<div className="flex h-11 items-center justify-between gap-4 px-4">
				<h2 className="font-semibold text-lg text-gray-600 no-line-height">
					Emergency Contact
				</h2>
				<DropdownMenu>
					<DropdownMenuTrigger
						type="button"
						className="inline-flex size-9 items-center justify-center rounded-md border border-transparent text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
						aria-label="Open actions for Emergency Contact"
					>
						<RiMore2Fill className="size-5" aria-hidden />
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="w-[13.75rem] rounded-xl border border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
					>
						<DropdownMenuItem className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white">
							<RiEditLine className="text-white" />
							<span>Edit info</span>
						</DropdownMenuItem>
						<DropdownMenuItem className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white">
							<RiShareForwardBoxLine className="text-white" />
							<span>Export info</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-6 rounded-xl bg-white p-4 ring ring-gray-200">
				{emergencyContact.map((item) => (
					<div key={item.label} className="flex w-full flex-col gap-4">
						<div className="text-sm font-normal text-gray-400 no-line-height">{item.label}</div>
						<div className="text-sm font-semibold text-gray-600 no-line-height">{item.value}</div>
					</div>
				))}
			</div>
		</section>
	);
}

function PhysicalInformation() {
	return (
		<section className="rounded-xl bg-gray-50 ring ring-gray-200">
			<div className="flex h-11 items-center justify-between gap-4 px-4">
				<h2 className="font-semibold text-lg text-gray-600 no-line-height">
					Physical Information
				</h2>
				<DropdownMenu>
					<DropdownMenuTrigger
						type="button"
						className="inline-flex size-9 items-center justify-center rounded-md border border-transparent text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
						aria-label="Open actions for Physical Information"
					>
						<RiMore2Fill className="size-5" aria-hidden />
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="w-[13.75rem] rounded-xl border border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
					>
						<DropdownMenuItem className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white">
							<RiEditLine className="text-white" />
							<span>Edit info</span>
						</DropdownMenuItem>
						<DropdownMenuItem className="flex items-center gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white">
							<RiShareForwardBoxLine className="text-white" />
							<span>Export info</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<div className="grid grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] gap-6 rounded-xl bg-white p-4 ring ring-gray-200">
				{physicalInformation.map((item) => (
					<div key={item.label} className="flex w-full flex-col gap-4">
						<div className="text-sm font-normal text-gray-400 no-line-height">{item.label}</div>
						<div className="text-sm font-semibold text-gray-600 no-line-height">{item.value}</div>
					</div>
				))}
			</div>
		</section>
	);
}

const personalInformation = [
	{ label: "First name", value: "Timothy" },
	{ label: "Middle name", value: "Chibuike" },
	{ label: "Last name", value: "Maduabuchi" },
	{ label: "Patient ID", value: "1234567890" },
	{ label: "Age", value: "100" },
	{ label: "Date Of Birth", value: "10-02-1926" },
	{ label: "Sex", value: "Male" },
	{ label: "Marital Status", value: "Single" },
	{ label: "National ID", value: "1234567890" },
];

const contactInformation = [
	{ label: "Phone number", value: "1234567890" },
	{ label: "Email Address", value: "chibuikemaduabuchi2023@gmail.com" },
	{ label: "Residential address", value: "12 Allen Avenue, Ikeja, Lagos, Nigeria" },
	{ label: "State of Origin", value: "Enugu State" },
	{ label: "Country of Origin", value: "Nigeria" },
];

const emergencyContact = [
	{ label: "First Name", value: "Emmanuel" },
	{ label: "Middle Name", value: "Okereke" },
	{ label: "Last Name", value: "Okafor" },
	{ label: "Relationship", value: "Wife" },
	{ label: "Phone", value: "1234567890" },
];

const physicalInformation = [
	{ label: "Height", value: "175cm" },
	{ label: "Weight", value: "68kg" },
	{ label: "Blood Group", value: "0+" },
	{ label: "Genotype", value: "AA" },
];
