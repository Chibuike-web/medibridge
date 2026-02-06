import { useRouter } from "next/navigation";
import { useParsedPatient } from "@/store/use-parsed-patient-store";
import { useParseStatus } from "@/store/use-parse-status-store";
import { useUpload } from "@/store/use-upload-store";

export function useFileParse() {
	const router = useRouter();
	const { parseStatus, setParseStatus } = useParseStatus();
	const { setPatientData } = useParsedPatient();
	const { selectedFiles, clearAll } = useUpload();

	const parseFile = async () => {
		if (selectedFiles.length === 0) return;
		setParseStatus("parsing");
		try {
			const filenames = selectedFiles.map((f) => f.file.name);

			const res = await fetch("/api/parse-file", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ filenames }),
			});

			const parsed = await res.json();

			if (!res.ok) {
				setParseStatus("error");
				throw new Error("Issue parsing file");
			}

			setParseStatus("success");
			setPatientData(parsed);

			clearAll();
			router.push("/dashboard/review-info-extract");
		} catch (error) {
			console.error(error);
			setParseStatus("error");
		}
	};
	return {
		parseStatus,
		setParseStatus,
		parseFile,
	};
}
