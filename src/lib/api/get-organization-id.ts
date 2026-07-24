// src/lib/api/get-organization-id.ts
import "server-only";

import { cache } from "react";
import { and, eq } from "drizzle-orm";

import { member, organization } from "@/db/schemas/auth";
import { db } from "@/lib/better-auth/auth";
import { verifySession } from "./verify-session";

export type OrganizationContext = {
  userId: string;
  organizationId: string;
  memberId: string;
  role: string;
  organizationName: string;
  isOrganizationVerified: boolean;
};

export const getOrganizationContext = cache(
  async (): Promise<OrganizationContext | null> => {
    const session = await verifySession();
    const activeOrganizationId = session.session.activeOrganizationId;

    if (!activeOrganizationId) {
      return null;
    }

    const [context] = await db
      .select({
        userId: member.userId,
        organizationId: member.organizationId,
        memberId: member.id,
        role: member.role,
        organizationName: organization.name,
        isOrganizationVerified: organization.isVerified,
      })
      .from(member)
      .innerJoin(organization, eq(member.organizationId, organization.id))
      .where(
        and(
          eq(member.userId, session.user.id),
          eq(member.organizationId, activeOrganizationId),
        ),
      )
      .limit(1);

    return context ?? null;
  },
);

export const getOrganizationId = cache(async () => {
  const context = await getOrganizationContext();

  return context?.organizationId ?? null;
});
