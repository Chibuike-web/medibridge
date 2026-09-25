"use server";

import { acceptInvitationService } from "@/services/auth/accept-invite-service";
import { getOrganizationAccessService } from "@/services/auth/get-organization-access-service";
import { inviteAdminService } from "@/services/auth/invite-admin-service";
import { createHospitalService } from "@/services/hospital/create-hospital-service";
import { HospitalDetailsType } from "../schemas/hospital-details-schema";
import { InviteType } from "../schemas/invite-schema";

export async function acceptInvitationAction(invitationId: string) {
	return acceptInvitationService(invitationId);
}

export async function getOrganizationAccessAction(organizationId: string) {
	return getOrganizationAccessService(organizationId);
}

export async function inviteAdminAction(data: InviteType) {
	return inviteAdminService(data);
}

export async function createHospitalAction(data: HospitalDetailsType) {
	return createHospitalService(data);
}
