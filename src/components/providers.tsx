"use client";

import React from "react";
import { AppProgressProvider } from "@bprogress/next";

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<AppProgressProvider height="3px" color="#29d" options={{ showSpinner: false }}>
			{children}
		</AppProgressProvider>
	);
}
