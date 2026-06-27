import "@/styles/globals.css";
import { Agentation } from "agentation";
import { Providers } from "../providers";

export function Shell({ children }: { children: React.ReactNode }) {
	return (
		<>
			<Providers>{children}</Providers>
			{process.env.NODE_ENV === "development" && <Agentation />}
		</>
	);
}
