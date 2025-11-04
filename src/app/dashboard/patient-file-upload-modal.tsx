import CloseLine from "@/icons/close-line";
import LoaderLine from "@/icons/loader-line";
import CheckCircle from "@/icons/check-circle";
import { Button } from "@/components/ui/button";
import FileUploadCard from "@/components/file-upload-card";
import ChooseFileCard from "@/components/choose-file-card";
import useFileParse from "@/hooks/use-file-parse";
import useFileUpload from "@/hooks/use-file-upload";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useModal } from "@/store/use-modal-store";

export default function PatientFileUploadModal() {
	const { file, status, uploadType, uploadError, uploadRef, onClear, handleFileChange } =
		useFileUpload();
	const { parseStatus, setParseStatus } = useFileParse();
	const { isOpen, setIsOpen } = useModal();

	const handleClick = () => {
		setIsOpen(false);
		setParseStatus("idle");
	};
	const handleClear = () => {
		onClear();
		setParseStatus("idle");
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => (open ? null : handleClick())}>
			<DialogContent>
				<DialogHeader className="pt-6 px-6">
					<DialogTitle className="text-[clamp(18px,5vw,24px)] font-semibold">
						Upload Patient's Record
					</DialogTitle>
					<DialogClose asChild>
						<button
							onClick={() => {
								setIsOpen(false);
								setParseStatus("idle");
							}}
						>
							<CloseLine className="size-8" />
						</button>
					</DialogClose>
				</DialogHeader>

				<p className="text-gray-600 mt-[14px] mb-6 px-6">
					Upload a document containing patient information. Supported formats: PDF, PNG, JPG, DOCX.
				</p>
				<div className="px-6 pb-6">
					{file ? (
						<FileUploadCard
							file={file}
							onClear={handleClear}
							status={status}
							uploadType={uploadType}
							uploadError={uploadError}
						/>
					) : (
						<ChooseFileCard handleFileChange={handleFileChange} uploadRef={uploadRef} />
					)}
					{parseStatus === "error" && (
						<p className="text-red-500 font-medium mt-2">Issue parsing the file, Try again</p>
					)}
				</div>
				{status === "completed" && <Footer />}
			</DialogContent>
		</Dialog>
	);
}

const Footer = () => {
	const { parseFile, parseStatus, setParseStatus } = useFileParse();
	const { onClear } = useFileUpload();

	return (
		<DialogFooter className="border-t border-gray-200">
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

			{parseStatus === "idle" || parseStatus === "error" ? (
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
		</DialogFooter>
	);
};
