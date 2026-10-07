import "@/styles/globals.css";
import { Agentation } from "agentation";

export function Shell({ children }: { children: React.ReactNode }) {
	return (
		<>
			{children}
			{process.env.NODE_ENV === "development" && <Agentation />}
		</>
	);
}
