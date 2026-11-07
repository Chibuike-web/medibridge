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
	const [selectedInterfaceFont, setSelectedInterfaceFont] = useState("system");
	const [selectedFontSize, setSelectedFontSize] = useState("default");

	return (
		<section aria-labelledby="general-appearance-heading" className="px-4 py-5">
			<h3 id="general-appearance-heading" className="font-semibold">
				General
			</h3>
			<dl>
				<div className="flex h-16 items-center justify-between gap-4 border-b">
					<dt id="theme-setting-label" className="text-sm font-medium text-gray-600">
						Theme
					</dt>
					<dd>
						<Select value={selectedTheme} onValueChange={setSelectedTheme}>
							<SelectTrigger
								aria-labelledby="theme-setting-label"
								className="border-transparent font-semibold text-gray-800 hover:bg-gray-100"
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent align="end" className="min-w-50">
								<SelectItem value="system">System</SelectItem>
								<SelectItem value="dark">Dark</SelectItem>
								<SelectItem value="light">Light</SelectItem>
							</SelectContent>
						</Select>
					</dd>
				</div>
				<div className="flex h-16 items-center justify-between gap-4 border-b">
					<dt id="contrast-setting-label" className="text-sm font-medium text-gray-600">
						Contrast
					</dt>
					<dd>
						<Select value={selectedContrast} onValueChange={setSelectedContrast}>
							<SelectTrigger
								aria-labelledby="contrast-setting-label"
								className="border-transparent font-semibold text-gray-800 hover:bg-gray-100"
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent align="end" className="min-w-50">
								<SelectItem value="system">System</SelectItem>
								<SelectItem value="medium">Medium</SelectItem>
								<SelectItem value="increased">Increased</SelectItem>
							</SelectContent>
						</Select>
					</dd>
				</div>
				<div className="flex h-16 items-center justify-between gap-4 border-b">
					<dt id="interface-font-setting-label" className="text-sm font-medium text-gray-600">
						Interface font
					</dt>
					<dd>
						<Select value={selectedInterfaceFont} onValueChange={setSelectedInterfaceFont}>
							<SelectTrigger
								aria-labelledby="interface-font-setting-label"
								className="border-transparent font-semibold text-gray-800 hover:bg-gray-100"
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent align="end" className="min-w-50">
								<SelectItem value="system">System</SelectItem>
								<SelectItem value="inter">Inter</SelectItem>
							</SelectContent>
						</Select>
					</dd>
				</div>
				<div className="flex h-16 items-center justify-between gap-4 border-b">
					<dt id="font-size-setting-label" className="text-sm font-medium text-gray-600">
						Font size
					</dt>
					<dd>
						<Select value={selectedFontSize} onValueChange={setSelectedFontSize}>
							<SelectTrigger
								aria-labelledby="font-size-setting-label"
								className="w-[12.5rem] justify-between font-semibold text-gray-800"
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent align="end">
								<SelectItem value="small">Small</SelectItem>
								<SelectItem value="default">Default</SelectItem>
								<SelectItem value="large">Large</SelectItem>
							</SelectContent>
						</Select>
					</dd>
				</div>
			</dl>
		</section>
	);
}
