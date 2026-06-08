export function toSortValue(value: Date | string | null) {
	if (!value) return "";

	const date = value instanceof Date ? value : new Date(value);

	return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}
