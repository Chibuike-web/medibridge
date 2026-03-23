"use client";

import { useContext } from "react";
import { OverviewStats } from "@/services/patient/types";
import { StatContext } from "./stats-context";

export function useStats(): OverviewStats {
	const context = useContext(StatContext);

	if (!context) {
		throw new Error("useStats must be used within a StatContextProvider");
	}

	return context;
}
