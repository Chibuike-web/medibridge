"use client";

import { startStudio } from "cssstudio";
import { useEffect } from "react";

export function CssStudioDevtools() {
	useEffect(() => {
		if (process.env.NODE_ENV !== "development") {
			return;
		}

		startStudio();
	}, []);

	return null;
}
