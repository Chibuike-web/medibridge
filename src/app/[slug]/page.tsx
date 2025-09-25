import Dashboard from "./dashboard";
import PatientsRecords from "./patients-records";
import Transfers from "./transfers";

export default async function MainContent({ params }: { params: { slug: string } }) {
	const { slug } = await params;
	return (
		<>
			{slug === "dashboard" ? (
				<Dashboard />
			) : slug === "patients-records" ? (
				<PatientsRecords />
			) : slug === "transfers" ? (
				<Transfers />
			) : null}
		</>
	);
}
