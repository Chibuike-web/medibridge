import { redirect } from "next/navigation";
import Dashboard from "./dashboard/dashboard";
import PatientsRecords from "./patients-records/patients-records";
import Transfers from "./transfers/transfers";

export default async function MainContent({ params }: { params: { slug: string } }) {
	const { slug } = await params;
	if (slug === "dashboard") return <Dashboard />;
	if (slug === "patients-records") return <PatientsRecords />;
	if (slug === "transfers") return <Transfers />;

	redirect("/dashboard");
}
