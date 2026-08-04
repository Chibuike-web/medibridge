"use client";

import type { ReactNode } from "react";
import { authClient } from "@/lib/better-auth/auth.client";

export function ArchiveAction({ children }: { children: ReactNode }) {
	const { data: activeMemberRole } = authClient.useActiveMemberRole();
	const canArchive = activeMemberRole?.role === "owner" || activeMemberRole?.role === "admin";

	return canArchive ? children : null;
}
