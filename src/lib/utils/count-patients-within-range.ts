export function countPatientsWithinRange(patientCreatedAt: Date[], duration?: string) {
	if (!duration) return patientCreatedAt.length;

	const now = new Date();
	const startDate = new Date(now);

	switch (duration) {
		case "This Month":
			startDate.setDate(1);
			startDate.setHours(0, 0, 0, 0);
			break;
		case "Last Month":
			startDate.setMonth(startDate.getMonth() - 1, 1);
			startDate.setHours(0, 0, 0, 0);
			now.setDate(1);
			now.setHours(0, 0, 0, 0);
			return patientCreatedAt.filter((date) => date >= startDate && date < now).length;
		case "Last 3 Months":
			startDate.setMonth(startDate.getMonth() - 3);
			break;
		case "Last 6 Months":
			startDate.setMonth(startDate.getMonth() - 6);
			break;
		case "This Year":
			startDate.setMonth(0, 1);
			startDate.setHours(0, 0, 0, 0);
			break;
		case "Last Year": {
			const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
			const thisYearStart = new Date(now.getFullYear(), 0, 1);
			return patientCreatedAt.filter((date) => date >= lastYearStart && date < thisYearStart).length;
		}
		default:
			startDate.setDate(startDate.getDate() - 7);
	}

	return patientCreatedAt.filter((date) => date >= startDate).length;
}
