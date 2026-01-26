import { useRouter } from "next/navigation";
import { useParsedPatient } from "@/store/use-parsed-patient-store";
import { useParseStatus } from "@/store/use-parse-status-store";
import { useUpload } from "@/store/use-upload-store";
import { useModal } from "@/store/use-modal-store";

export function useFileParse() {
	const router = useRouter();
	const { parseStatus, setParseStatus } = useParseStatus();
	const { setPatientData } = useParsedPatient();
	const { file, onClear } = useUpload();
	const { setIsOpen } = useModal();

	const parseFile = async () => {
		if (!file) return;
		setParseStatus("parsing");
		try {
			const res = await fetch("/api/parse-file", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ filename: file.name }),
			});

			const parsed = await res.json();

			if (!res.ok) {
				setParseStatus("error");
				throw new Error("Issue parsing file");
			}

			setParseStatus("success");
			setPatientData(parsed);

			await new Promise((res) => setTimeout(res, 1000));

			router.push("/dashboard/review-info-extract");

			setTimeout(() => {
				onClear();
				setParseStatus("idle");
				setIsOpen(false);
			}, 2500);
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
