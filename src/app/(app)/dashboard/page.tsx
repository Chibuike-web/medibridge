import { redirect } from "next/navigation";

export const metadata = {
	title: "Dashboard",
};

export default function Dashboard() {
	redirect("/dashboard/overview");
}
