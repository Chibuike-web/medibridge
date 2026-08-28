"use client";

import { useState } from "react";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export function AppearanceSettings() {
	const [selectedTheme, setSelectedTheme] = useState("system");
	const [selectedContrast, setSelectedContrast] = useState("system");

	return (
		<div className="px-6 py-4">
			<dl>
				<div className="flex h-16 items-center justify-between gap-4 border-b">
					<dt id="theme-setting-label" className="text-sm text-gray-400">
						Theme
					</dt>
					<dd>
						<Select value={selectedTheme} onValueChange={setSelectedTheme}>
							<SelectTrigger
								aria-labelledby="theme-setting-label"
								className="h-9 border-transparent px-3 font-semibold text-gray-800 hover:bg-gray-100"
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent align="end" className="min-w-[220px]">
								<SelectItem value="system">System</SelectItem>
								<SelectItem value="dark">Dark</SelectItem>
								<SelectItem value="light">Light</SelectItem>
							</SelectContent>
						</Select>
					</dd>
				</div>
				<div className="flex h-16 items-center justify-between gap-4 border-b">
					<dt id="contrast-setting-label" className="text-sm text-gray-400">
						Contrast
					</dt>
					<dd>
						<Select value={selectedContrast} onValueChange={setSelectedContrast}>
							<SelectTrigger
								aria-labelledby="contrast-setting-label"
								className="h-9 border-transparent px-3 font-semibold text-gray-800 hover:bg-gray-100"
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent align="end" className="min-w-[220px]">
								<SelectItem value="system">System</SelectItem>
								<SelectItem value="medium">Medium</SelectItem>
								<SelectItem value="increased">Increased</SelectItem>
							</SelectContent>
						</Select>
					</dd>
				</div>
			</dl>
		</div>
	);
}
