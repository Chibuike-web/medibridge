import { useRouter } from "next/navigation";
import { useParsedPatient } from "@/store/use-parsed-patient-store";
import { useParseStatus } from "@/store/use-parse-status-store";
import { useUpload } from "@/store/use-upload-store";

export default function useFileParse() {
	const { parseStatus, setParseStatus } = useParseStatus();
	const router = useRouter();
	const { setPatientData } = useParsedPatient();
	const { file, onClear } = useUpload();

	const parseFile = async () => {
		if (!file) return;
		console.log("click");
		setParseStatus("parsing");
		try {
			const res = await fetch("/api/parse-file", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ filename: file.name }),
			});

			const { data } = await res.json();

			if (!res.ok) {
				setParseStatus("error");
				throw new Error("Issue parsing file");
			}

			setParseStatus("success");
			router.push("/review-info-extract");

			setTimeout(() => {
				setPatientData(data);
				onClear();
				setParseStatus("idle");
			}, 1500);
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
