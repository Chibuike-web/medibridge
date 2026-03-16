"use server";

import { HospitalDetailsType } from "@/app/(auth)/schemas/hospital-details-schema";
import { OwnerType } from "@/app/(auth)/schemas/owner-schema";
import { SignInType } from "@/app/(auth)/schemas/sign-in-schema";
import { createOwnerService } from "@/services/auth/create-owner-service";
import { listOrganizationService } from "@/services/auth/list-organization-service";
import { signInService } from "@/services/auth/sign-in-service";
import { createHospitalService } from "@/services/hospital/create-hospital-service";

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
