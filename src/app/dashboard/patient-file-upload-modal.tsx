import { useFileUploadContext } from "../../../context/file-upload";
import { useFileParseContext } from "../../../context/file.parse";
import CloseLine from "@/icons/close-line";
import LoaderLine from "@/icons/loader-line";
import CheckCircle from "@/icons/check-circle";
import { Button } from "@/components/ui/button";
import FileUploadCard from "@/components/file-upload-card";
import ChooseFileCard from "@/components/choose-file-card";
import {
	DialogBackdrop,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogMain,
	DialogTitle,
} from "@/components/ui/dialog-modal";

export default function PatientFileUploadModal({
	setIsUploadPatientModalOpen,
}: {
	setIsUploadPatientModalOpen: (value: boolean) => void;
}) {
	const { file, onClear, status } = useFileUploadContext();
	const { parseStatus, setParseStatus, parseFile } = useFileParseContext();
	return (
		<DialogBackdrop setIsUploadPatientModalOpen={setIsUploadPatientModalOpen}>
			<DialogMain>
				<div className="px-6 pt-6 pb-6">
					<DialogHeader>
						<DialogTitle>
							<h1 className="text-[clamp(18px,5vw,24px)] font-semibold">Upload Patient's Record</h1>
						</DialogTitle>
						<DialogClose>
							<button onClick={() => setIsUploadPatientModalOpen(false)}>
								<CloseLine className="size-8" />
							</button>
						</DialogClose>
					</DialogHeader>
					<DialogContent>
						<p className="text-gray-600 mt-[14px] mb-6">
							Upload a document containing patient information. Supported formats: PDF, PNG, JPG,
							DOCX.
						</p>
						{file ? <FileUploadCard /> : <ChooseFileCard />}
					</DialogContent>
				</div>
				<DialogFooter>
					{status === "completed" && (
						<div className="flex items-center justify-between p-6 border-t border-gray-200">
							{["parsing", "success"].includes(parseStatus) ? (
								<div className="flex items-center justify-center gap-4 w-full">
									{parseStatus === "parsing" ? (
										<LoaderLine className="animate-spin size-5" />
									) : (
										<CheckCircle className="size-5" />
									)}
									<span>
										{parseStatus === "parsing"
											? "Extracting patient data..."
											: " Patient data extracted successfully."}
									</span>
								</div>
							) : null}

							{parseStatus === "idle" ? (
								<>
									<Button
										variant="outline"
										className="h-11 cursor-pointer"
										onClick={() => {
											setParseStatus("idle");
											onClear();
										}}
									>
										Cancel
									</Button>
									<Button className="h-11 cursor-pointer" onClick={parseFile}>
										Parse Document
									</Button>
								</>
							) : null}
						</div>
					)}
				</DialogFooter>
			</DialogMain>
		</DialogBackdrop>
	);
}
