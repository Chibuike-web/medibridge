"use client";

import React from "react";
import { AppProgressProvider } from "@bprogress/next";

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<AppProgressProvider
			height="0.1875rem"
			color="#29d"
			delay={1}
			options={{ showSpinner: false }}
		>
			{children}
		</AppProgressProvider>
	);
}
