import { useRouter } from "next/navigation";
import { useState } from "react";
import { useParsedPatient } from "@/store/use-parsed-patient-store";
import { useFileUploadContext } from "../../context/file-upload";

export default function useFileParse() {
	const [parseStatus, setParseStatus] = useState<"idle" | "parsing" | "success" | "error">("idle");
	const router = useRouter();

	const { setPatientData } = useParsedPatient();

	const { file } = useFileUploadContext();

	const parseFile = async () => {
		console.log("click");
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
				throw new Error("Issue parsing file");
			}
			setParseStatus("success");
			console.log("Parsed info", data);
			setTimeout(() => {
				setPatientData(data);
				router.push("/review-info-extract");
			}, 1500);
		} catch (error) {
			console.error(error);
		}
	};
	return {
		parseStatus,
		setParseStatus,
		parseFile,
	};
}
