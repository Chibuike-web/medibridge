"use server";

import { HospitalType } from "@/store/use-hospital-store";

export default async function saveHospital(data: HospitalType) {
	try {
		console.log(data);
		return {
			status: "success",
			message: "Data successfully saved",
		};
	} catch (error) {
		return {
			status: "failed",
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}
