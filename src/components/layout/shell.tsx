import "@/styles/globals.css";
import { Providers } from "@/components/providers";
import { Agentation } from "agentation";

export function Shell({ children }: { children: React.ReactNode }) {
	return (
		<>
			<Providers>{children}</Providers>
			{process.env.NODE_ENV === "development" && <Agentation />}
		</>
	);
}
