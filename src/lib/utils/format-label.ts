export function formatLabel(value: string) {
	const label = value
		.replace(/[-_]+/g, " ")
		.replace(/\s+/g, " ")
		.trim()
		.toLowerCase();

	return label.charAt(0).toUpperCase() + label.slice(1);
}
