export function formatKey(key: string) {
	return key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
}
