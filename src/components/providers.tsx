"use client";

import React from "react";
import { AppProgressProvider } from "@bprogress/next";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>
			<AppProgressProvider height="3px" color="#29d" delay={1} options={{ showSpinner: false }}>
				{children}
			</AppProgressProvider>
		</QueryClientProvider>
	);
}
