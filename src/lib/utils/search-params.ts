import { endOfDay, startOfDay } from "date-fns";
import { parseDateParam } from "@/lib/utils/parse-date-param";

export type DateBoundary = "start" | "end";

export function getStringParam(value: unknown, fallback = "") {
	return typeof value === "string" ? value : fallback;
}

export function getNumberParam(value: unknown, fallback: number, options?: { min?: number }) {
	if (typeof value !== "string") return fallback;

	const numberValue = Number.parseInt(value, 10);

	if (Number.isNaN(numberValue)) return fallback;

	return Math.max(numberValue, options?.min ?? Number.MIN_SAFE_INTEGER);
}

export function parseDateBoundaryParam(value: string, boundary: DateBoundary) {
	const date = parseDateParam(value);
	if (!date) return undefined;

	return boundary === "start" ? startOfDay(date) : endOfDay(date);
}
