export function getOrdinal(day: number) {
	const remainder = day % 10;
	const teenRange = day % 100;

	if (teenRange >= 11 && teenRange <= 13) {
		return "th";
	}

	if (remainder === 1) return "st";
	if (remainder === 2) return "nd";
	if (remainder === 3) return "rd";
	return "th";
}
