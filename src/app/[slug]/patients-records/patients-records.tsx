import { Button } from "@/components/ui/button";
import Plus from "@/icons/plus";

export default function PatientsRecords() {
	return (
		<div className="w-full mx-auto max-w-[1440px] flex items-center justify-center h-full p-10">
			<div className="flex flex-col items-center max-w-[355px]">
				<h1 className="font-semibold text-[24px] text-center mb-6">No records yet</h1>
				<p className="mb-12 text-center">
					Patient records will appear here once you add them. Start by creating a patient profile.
				</p>
				<Button>
					<Plus />
					Add new patient
				</Button>
			</div>
		</div>
	);
}
