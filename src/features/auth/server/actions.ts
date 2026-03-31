"use server";

import { createOwnerService } from "@/services/auth/create-owner-service";
import { listOrganizationService } from "@/services/auth/list-organization-service";
import { signInService } from "@/services/auth/sign-in-service";
import { createHospitalService } from "@/services/hospital/create-hospital-service";
import { HospitalDetailsType } from "../schemas/hospital-details-schema";
import { OwnerType } from "../schemas/owner-schema";
import { SignInType } from "../schemas/sign-in-schema";

export async function signInAction(data: SignInType) {
	return signInService(data);
}

export async function listOrganizationAction() {
	return listOrganizationService();
}

export async function createOwnerAction(data: OwnerType) {
	return createOwnerService(data);
}

export async function createHospitalAction(data: HospitalDetailsType) {
	return createHospitalService(data);
}
