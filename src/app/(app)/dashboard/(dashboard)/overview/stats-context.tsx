"use client";

import { OverviewStats } from "@/services/patient/types";
import { createContext, use } from "react";

const StatContext = createContext<OverviewStats | null>(null);

export function useStats(): OverviewStats {
	const context = use(StatContext);

	if (!context) throw new Error("useStats must be used within a StatContextProvider");

	return context;
}

export function StatContextProvider({
	children,
	stats,
}: {
	children: React.ReactNode;
	stats: OverviewStats;
}) {
	return <StatContext.Provider value={stats}>{children}</StatContext.Provider>;
}
