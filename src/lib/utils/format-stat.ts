export function formatStat(value: number) {
	return new Intl.NumberFormat("en-US").format(value);
}
