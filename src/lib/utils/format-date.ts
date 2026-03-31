import { getOrdinal } from "./get-ordinal";

export function formatDate(value: string) {
	const date = new Date(value);
	const day = date.getDate();
	const month = date.toLocaleString("en-US", { month: "short" });
	const year = date.getFullYear();
	const time = date
		.toLocaleString("en-US", {
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
		})
		.replace(" AM", "AM")
		.replace(" PM", "PM");

	return `${day}${getOrdinal(day)} ${month} ${year}, ${time}`;
}
