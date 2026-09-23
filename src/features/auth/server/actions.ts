"use server";

import { createOwnerService } from "@/services/auth/create-owner-service";
import {
	acceptInvitationService,
	createInvitedAdminService,
} from "@/services/auth/accept-invite-service";
import { getOrganizationAccessService } from "@/services/auth/get-organization-access-service";
import { inviteAdminService } from "@/services/auth/invite-admin-service";
import { listOrganizationService } from "@/services/auth/list-organization-service";
import { signInService } from "@/services/auth/sign-in-service";
import { createHospitalService } from "@/services/hospital/create-hospital-service";
import { HospitalDetailsType } from "../schemas/hospital-details-schema";
import { OwnerType } from "../schemas/owner-schema";
import { SignInType } from "../schemas/sign-in-schema";
import { InviteType } from "../schemas/invite-schema";
import type { CreateInvitedAdminType } from "../schemas/accept-invite-schema";

export async function createInvitedAdminAction(invitationId: string, data: CreateInvitedAdminType) {
	return createInvitedAdminService(invitationId, data);
}

export async function acceptInvitationAction(invitationId: string) {
	return acceptInvitationService(invitationId);
}

export async function signInAction(data: SignInType) {
	return signInService(data);
}

export async function listOrganizationAction() {
	return listOrganizationService();
}

export async function getOrganizationAccessAction(organizationId: string) {
	return getOrganizationAccessService(organizationId);
}

export async function inviteAdminAction(data: InviteType) {
	return inviteAdminService(data);
}

export async function createOwnerAction(data: OwnerType) {
	return createOwnerService(data);
}

export async function createHospitalAction(data: HospitalDetailsType) {
	return createHospitalService(data);
}
