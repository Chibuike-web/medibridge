export function inferMime(path: string): string {
	if (path.endsWith(".pdf")) return "application/pdf";
	if (path.endsWith(".docx") || path.endsWith(".doc"))
		return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
	if (path.endsWith(".png")) return "image/png";
	if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
	return "application/octet-stream";
}
