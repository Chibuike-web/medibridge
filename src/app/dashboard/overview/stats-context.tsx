"use client";

import { OverviewStats } from "@/services/patient/types";
import { createContext } from "react";

export const StatContext = createContext<OverviewStats | null>(null);

export function StatContextProvider({
	children,
	stats,
}: {
	children: React.ReactNode;
	stats: OverviewStats;
}) {
	return <StatContext.Provider value={stats}>{children}</StatContext.Provider>;
}
