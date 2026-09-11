"use client";

import { useCallback, useState } from "react";
import { format, subDays } from "date-fns";
import { CartesianGrid, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import { RiArrowRightSLine } from "@remixicon/react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { VitalType } from "@/features/patients/types";

const vitalMetrics = {
	systolic: { label: "Blood pressure", unit: "mmHg" },
	heartRate: { label: "Heart rate", unit: "bpm" },
	respiratoryRate: { label: "Respiratory rate", unit: "breaths/min" },
	temperature: { label: "Temperature", unit: "°C" },
	oxygenSaturation: { label: "Oxygen saturation", unit: "%" },
	weight: { label: "Weight", unit: "kg" },
	bmi: { label: "BMI", unit: "kg/m²" },
} as const;

type VitalMetric = keyof typeof vitalMetrics;

const vitalChartPeriods = [
	{ value: "30", label: "30 days", tickCount: 4 },
	{ value: "90", label: "90 days", tickCount: 7 },
	{ value: "180", label: "6 months", tickCount: 7 },
	{ value: "365", label: "1 year", tickCount: 8 },
	{ value: "all", label: "All time", tickCount: 8 },
] as const;

type VitalChartPeriod = (typeof vitalChartPeriods)[number]["value"];

export function VitalsChart({ readings }: { readings: VitalType[] }) {
	const [selectedMetric, setSelectedMetric] = useState<VitalMetric>("systolic");
	const [selectedPeriod, setSelectedPeriod] = useState<VitalChartPeriod>("30");
	const [chartReferenceTimestamp] = useState(() => Date.now());
	const [chartWidth, setChartWidth] = useState(0);

	const measureChartWidth = useCallback((node: HTMLDivElement | null) => {
		if (!node) return;

		const updateChartWidth = () => setChartWidth(Math.round(node.getBoundingClientRect().width));
		updateChartWidth();

		if (typeof ResizeObserver === "undefined") return;

		const resizeObserver = new ResizeObserver(updateChartWidth);
		resizeObserver.observe(node);

		return () => resizeObserver.disconnect();
	}, []);

	const metric = vitalMetrics[selectedMetric];
	const period = vitalChartPeriods.find((option) => option.value === selectedPeriod)!;
	const cutoff =
		selectedPeriod === "all"
			? 0
			: subDays(chartReferenceTimestamp, Number(selectedPeriod)).getTime();
	const chartReadings = readings
		.filter((reading) => reading.recordedAt >= cutoff)
		.sort((a, b) => a.recordedAt - b.recordedAt);
	const chartRangeEnd =
		selectedPeriod === "all"
			? (chartReadings.at(-1)?.recordedAt ?? chartReferenceTimestamp)
			: chartReferenceTimestamp;
	const initialChartRangeStart =
		selectedPeriod === "all" ? (chartReadings[0]?.recordedAt ?? chartRangeEnd) : cutoff;
	const chartRangeStart =
		initialChartRangeStart === chartRangeEnd
			? subDays(chartRangeEnd, 1).getTime()
			: initialChartRangeStart;
	const chartTicks = Array.from(
		{ length: period.tickCount },
		(_, index) =>
			chartRangeStart + ((chartRangeEnd - chartRangeStart) * index) / (period.tickCount - 1),
	);
	const values = chartReadings.map((reading) => reading[selectedMetric]);
	const latest = chartReadings.at(-1);
	const previous = chartReadings.at(-2);

	function displayValue(reading?: VitalType) {
		if (!reading) return "—";

		const diastolic = selectedMetric === "systolic" ? `/${reading.diastolic}` : "";

		return `${reading[selectedMetric]}${diastolic} ${metric.unit}`;
	}

	function summarize(operation: "average" | "lowest" | "highest") {
		if (!values.length) return "—";

		const calculate = (numbers: number[]) =>
			operation === "average"
				? Math.round((numbers.reduce((sum, value) => sum + value, 0) / numbers.length) * 10) / 10
				: operation === "lowest"
					? Math.min(...numbers)
					: Math.max(...numbers);
		const diastolic =
			selectedMetric === "systolic"
				? `/${calculate(chartReadings.map((reading) => reading.diastolic))}`
				: "";

		return `${calculate(values)}${diastolic} ${metric.unit}`;
	}

	const summaryItems = [
		["Current", displayValue(latest)],
		["Previous", displayValue(previous)],
		["Average", summarize("average")],
		["Lowest", summarize("lowest")],
		["Highest", summarize("highest")],
		["Last measured", latest ? format(latest.recordedAt, "dd MMM yyyy") : "—"],
	];

	return (
		<div className="mx-auto flex max-w-7xl w-full flex-col gap-5">
			<div className="flex flex-wrap items-center gap-3">
				<Select
					value={selectedMetric}
					onValueChange={(value) => setSelectedMetric(value as VitalMetric)}
				>
					<SelectTrigger className="w-[15.625rem]" aria-label="Vital measurement">
						<SelectValue />
					</SelectTrigger>
					<SelectContent className="w-[15.625rem]" align="start">
						{Object.entries(vitalMetrics).map(([key, value]) => (
							<SelectItem key={key} value={key}>
								{value.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select
					value={selectedPeriod}
					onValueChange={(value) => setSelectedPeriod(value as VitalChartPeriod)}
				>
					<SelectTrigger className="w-36" aria-label="Chart period">
						<SelectValue />
					</SelectTrigger>
					<SelectContent className="w-[15.625rem]" align="start">
						{vitalChartPeriods.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{selectedMetric === "systolic" ? (
					<div className="flex gap-3 text-sm">
						<span className="text-blue-600">● Systolic</span>
						<span className="text-purple-400">● Diastolic</span>
					</div>
				) : null}
			</div>
			<div className="rounded-xl border border-gray-200 p-5">
				<div className="mb-6 flex flex-wrap justify-between gap-5">
					<div>
						<h3 className="text-sm font-medium">{metric.label}</h3>
						<p className="text-sm text-gray-400">Measured in {metric.unit}</p>
					</div>
					<dl className="flex flex-wrap gap-4 text-sm">
						{summaryItems.map(([label, value]) => (
							<div key={label}>
								<dt className="text-gray-400">{label}:</dt>
								<dd className="mt-1 font-semibold text-gray-600">{value}</dd>
							</div>
						))}
					</dl>
				</div>
				<div
					ref={measureChartWidth}
					className="h-80"
					role="img"
					aria-label={`${metric.label} readings over the selected period. Values are also available in the table below.`}
				>
					{!chartReadings.length ? (
						<p className="pt-24 text-center text-sm text-gray-400">
							No measurements in this period.
						</p>
					) : chartWidth > 0 ? (
						<ScatterChart
							key={`${selectedMetric}-${selectedPeriod}`}
							width={chartWidth}
							height={320}
							style={{ width: "100%", height: "100%" }}
							margin={{ top: 12, right: 12, bottom: 12, left: 0 }}
						>
							<CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
							<XAxis
								dataKey="recordedAt"
								type="number"
								domain={[chartRangeStart, chartRangeEnd]}
								ticks={chartTicks}
								interval={0}
								padding={{ left: 0, right: 0 }}
								tickFormatter={(value) => format(value, "d MMM")}
								tick={{ fontSize: 12 }}
								stroke="#9ca3af"
							/>
							<YAxis
								dataKey="value"
								type="number"
								domain={[0, "auto"]}
								padding={{ top: 12, bottom: 0 }}
								tick={{ fontSize: 12 }}
								stroke="#9ca3af"
								unit=""
							/>
							<Tooltip
								content={({ active, payload }) => {
									const point = payload?.[0]?.payload;

									return active && point ? (
										<div className="w-[12.5rem] overflow-hidden rounded-xl border border-gray-200 bg-white text-xs shadow-xl">
											<div className="flex h-8 items-center justify-between bg-gray-50 px-3 text-gray-400">
												<span>{format(point.recordedAt, "d MMM yyyy, h:mm a")}</span>
												<RiArrowRightSLine className="size-4" aria-hidden="true" />
											</div>
											<div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-3 py-3">
												<span className="font-medium text-gray-600">
													{point.value} {metric.unit}
												</span>
												<span className="font-medium text-green-600">Normal</span>
											</div>
										</div>
									) : null;
								}}
							/>
							<Scatter
								name={metric.label}
								data={chartReadings.map((reading) => ({
									recordedAt: reading.recordedAt,
									value: reading[selectedMetric],
								}))}
								fill={selectedMetric === "systolic" ? "#2563eb" : "#282d37"}
								isAnimationActive={false}
							/>
							{selectedMetric === "systolic" ? (
								<Scatter
									name="Diastolic"
									data={chartReadings.map((reading) => ({
										recordedAt: reading.recordedAt,
										value: reading.diastolic,
									}))}
									fill="#c084fc"
									isAnimationActive={false}
								/>
							) : null}
						</ScatterChart>
					) : null}
				</div>
			</div>
		</div>
	);
}
