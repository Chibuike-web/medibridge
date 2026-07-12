import docFileFormat from "@/assets/file-formats/doc.svg";
import jpgFileFormat from "@/assets/file-formats/jpg.svg";
import pdfFileFormat from "@/assets/file-formats/pdf.svg";
import pngFileFormat from "@/assets/file-formats/png.svg";

const fileFormatIcons: Record<string, string> = {
	pdf: pdfFileFormat,
	jpg: jpgFileFormat,
	jpeg: jpgFileFormat,
	png: pngFileFormat,
	doc: docFileFormat,
	docx: docFileFormat,
};

export function getDocumentFileIcon(fileName: string, fileType: string) {
	const format = (fileType || fileName.split(".").pop() || "").toLowerCase();
	const normalizedFormat = format.replace("image/", "").replace("application/", "");

	return fileFormatIcons[normalizedFormat] ?? docFileFormat;
}
