import { formatRangeDate } from "./format-range-date";

export function getRangeLabel(duration?: string) {
	const now = new Date();
	const endDate = new Date(now);
	const startDate = new Date(now);

	switch (duration) {
		case "This Month":
			startDate.setDate(1);
			startDate.setHours(0, 0, 0, 0);
			return `${formatRangeDate(startDate)} - ${formatRangeDate(endDate)}`;
		case "Last Month": {
			const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
			const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
			return `${formatRangeDate(lastMonthStart)} - ${formatRangeDate(lastMonthEnd)}`;
		}
		case "Last 7 Days":
			startDate.setDate(startDate.getDate() - 7);
			return `${formatRangeDate(startDate)} - ${formatRangeDate(endDate)}`;
		case "Last 3 Months":
			startDate.setMonth(startDate.getMonth() - 3);
			return `${formatRangeDate(startDate)} - ${formatRangeDate(endDate)}`;
		case "Last 6 Months":
			startDate.setMonth(startDate.getMonth() - 6);
			return `${formatRangeDate(startDate)} - ${formatRangeDate(endDate)}`;
		case "This Year": {
			const yearStart = new Date(now.getFullYear(), 0, 1);
			return `${formatRangeDate(yearStart)} - ${formatRangeDate(endDate)}`;
		}
		case "Last Year": {
			const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
			const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);
			return `${formatRangeDate(lastYearStart)} - ${formatRangeDate(lastYearEnd)}`;
		}
		default:
			return duration;
	}
}
