import { isValid, parseISO } from "date-fns";

export function parseDateParam(value: string) {
	if (!value) return undefined;

	const date = parseISO(value);

	return isValid(date) ? date : undefined;
}
