export function getInitials(name: string) {
	return name
		.split(" ")
		.map((part) => part[0]?.toUpperCase())
		.filter(Boolean)
		.slice(0, 2)
		.join("");
}
