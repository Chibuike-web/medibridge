import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const formatFileSize = (bytes: number) => {
	if (bytes >= 1024 * 1024) {
		return (bytes / (1024 * 1024)).toFixed(2) + "MB";
	}
	return (bytes / 1024).toFixed(2) + "KB";
};
