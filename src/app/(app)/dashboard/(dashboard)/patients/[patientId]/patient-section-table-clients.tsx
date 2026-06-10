"use client";

import { AllergiesTable } from "@/features/patients/components/allergies-table";
import { DiagnosesTable } from "@/features/patients/components/diagnoses-table";
import { EncountersTable } from "@/features/patients/components/encounters-table";
import { ImagingTable } from "@/features/patients/components/imaging-table";
import { ImmunizationsTable } from "@/features/patients/components/immunizations-table";
import { LabTestsTable } from "@/features/patients/components/lab-tests-table";
import { MedicationsTable } from "@/features/patients/components/medications-table";
import { ProceduresTable } from "@/features/patients/components/procedures-table";
import {
	getPatientAllergiesTableAction,
	getPatientDiagnosesTableAction,
	getPatientEncountersTableAction,
	getPatientImagingTableAction,
	getPatientImmunizationsTableAction,
	getPatientLabTestsTableAction,
	getPatientMedicationsTableAction,
	getPatientProceduresTableAction,
} from "@/features/patients/server/actions";
import type {
	AllergyType,
	DiagnosisType,
	EncounterType,
	ImagingType,
	ImmunizationType,
	LabTestType,
	MedicationType,
	ProcedureType,
} from "@/features/patients/types";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { useOptimistic, useState, useTransition } from "react";

type SectionTableState<T> = {
	rows: T[];
	page: number;
	limit: number;
	totalPages: number;
};

export function DiagnosesClient({
	patientId,
	diagnoses,
	page,
	limit,
	totalPages,
}: {
	patientId: string;
	diagnoses: DiagnosisType[];
	page: number;
	limit: number;
	totalPages: number;
}) {
	const [tableData, setTableData] = useState<SectionTableState<DiagnosisType>>({
		rows: diagnoses,
		page,
		limit,
		totalPages,
	});
	const [optimisticPage, setOptimisticPage] = useOptimistic(tableData.page);
	const [optimisticLimit, setOptimisticLimit] = useOptimistic(tableData.limit);
	const [query, setQuery] = useState("");
	const [isPending, startTransition] = useTransition();
	const debouncedSearch = useDebouncedCallback((nextQuery: string) => {
		startTransition(async () => {
			setOptimisticPage(1);

			const result = await getPatientDiagnosesTableAction({
				patientId,
				page: 1,
				limit: tableData.limit,
				query: nextQuery,
			});

			setTableData({
				rows: result.diagnoses,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}, 300);

	function handleQueryChange(nextQuery: string) {
		setQuery(nextQuery);
		debouncedSearch(nextQuery);
	}

	function handlePreviousPage() {
		const nextPage = Math.max(tableData.page - 1, 1);
		startTransition(async () => {
			setOptimisticPage(nextPage);
			const result = await getPatientDiagnosesTableAction({
				patientId,
				page: nextPage,
				limit: tableData.limit,
				query,
			});

			setTableData({
				rows: result.diagnoses,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	function handleNextPage() {
		const nextPage = Math.min(tableData.page + 1, tableData.totalPages);
		startTransition(async () => {
			setOptimisticPage(nextPage);
			const result = await getPatientDiagnosesTableAction({
				patientId,
				page: nextPage,
				limit: tableData.limit,
				query,
			});

			setTableData({
				rows: result.diagnoses,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	function handleLimitChange(nextLimit: number) {
		startTransition(async () => {
			setOptimisticPage(1);
			setOptimisticLimit(nextLimit);
			const result = await getPatientDiagnosesTableAction({
				patientId,
				page: 1,
				limit: nextLimit,
				query,
			});

			setTableData({
				rows: result.diagnoses,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	return (
		<DiagnosesTable
			diagnoses={tableData.rows}
			page={optimisticPage}
			limit={optimisticLimit}
			totalPages={tableData.totalPages}
			query={query}
			isPending={isPending}
			onQueryChange={handleQueryChange}
			onPreviousPage={handlePreviousPage}
			onNextPage={handleNextPage}
			onLimitChange={handleLimitChange}
		/>
	);
}

export function AllergiesClient({
	patientId,
	allergies,
	page,
	limit,
	totalPages,
}: {
	patientId: string;
	allergies: AllergyType[];
	page: number;
	limit: number;
	totalPages: number;
}) {
	const [tableData, setTableData] = useState<SectionTableState<AllergyType>>({
		rows: allergies,
		page,
		limit,
		totalPages,
	});
	const [optimisticPage, setOptimisticPage] = useOptimistic(tableData.page);
	const [optimisticLimit, setOptimisticLimit] = useOptimistic(tableData.limit);
	const [query, setQuery] = useState("");
	const [isPending, startTransition] = useTransition();
	const debouncedSearch = useDebouncedCallback((nextQuery: string) => {
		startTransition(async () => {
			setOptimisticPage(1);

			const result = await getPatientAllergiesTableAction({
				patientId,
				page: 1,
				limit: tableData.limit,
				query: nextQuery,
			});

			setTableData({
				rows: result.allergies,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}, 300);

	function handleQueryChange(nextQuery: string) {
		setQuery(nextQuery);
		debouncedSearch(nextQuery);
	}

	function handlePreviousPage() {
		const nextPage = Math.max(tableData.page - 1, 1);
		startTransition(async () => {
			setOptimisticPage(nextPage);
			const result = await getPatientAllergiesTableAction({
				patientId,
				page: nextPage,
				limit: tableData.limit,
				query,
			});

			setTableData({
				rows: result.allergies,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	function handleNextPage() {
		const nextPage = Math.min(tableData.page + 1, tableData.totalPages);
		startTransition(async () => {
			setOptimisticPage(nextPage);
			const result = await getPatientAllergiesTableAction({
				patientId,
				page: nextPage,
				limit: tableData.limit,
				query,
			});

			setTableData({
				rows: result.allergies,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	function handleLimitChange(nextLimit: number) {
		startTransition(async () => {
			setOptimisticPage(1);
			setOptimisticLimit(nextLimit);
			const result = await getPatientAllergiesTableAction({
				patientId,
				page: 1,
				limit: nextLimit,
				query,
			});

			setTableData({
				rows: result.allergies,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	return (
		<AllergiesTable
			allergies={tableData.rows}
			page={optimisticPage}
			limit={optimisticLimit}
			totalPages={tableData.totalPages}
			query={query}
			isPending={isPending}
			onQueryChange={handleQueryChange}
			onPreviousPage={handlePreviousPage}
			onNextPage={handleNextPage}
			onLimitChange={handleLimitChange}
		/>
	);
}

export function ImmunizationsClient({
	patientId,
	immunizations,
	page,
	limit,
	totalPages,
}: {
	patientId: string;
	immunizations: ImmunizationType[];
	page: number;
	limit: number;
	totalPages: number;
}) {
	const [tableData, setTableData] = useState<SectionTableState<ImmunizationType>>({
		rows: immunizations,
		page,
		limit,
		totalPages,
	});
	const [optimisticPage, setOptimisticPage] = useOptimistic(tableData.page);
	const [optimisticLimit, setOptimisticLimit] = useOptimistic(tableData.limit);
	const [query, setQuery] = useState("");
	const [isPending, startTransition] = useTransition();
	const debouncedSearch = useDebouncedCallback((nextQuery: string) => {
		startTransition(async () => {
			setOptimisticPage(1);

			const result = await getPatientImmunizationsTableAction({
				patientId,
				page: 1,
				limit: tableData.limit,
				query: nextQuery,
			});

			setTableData({
				rows: result.immunizations,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}, 300);

	function handleQueryChange(nextQuery: string) {
		setQuery(nextQuery);
		debouncedSearch(nextQuery);
	}

	function handlePreviousPage() {
		const nextPage = Math.max(tableData.page - 1, 1);
		startTransition(async () => {
			setOptimisticPage(nextPage);
			const result = await getPatientImmunizationsTableAction({
				patientId,
				page: nextPage,
				limit: tableData.limit,
				query,
			});

			setTableData({
				rows: result.immunizations,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	function handleNextPage() {
		const nextPage = Math.min(tableData.page + 1, tableData.totalPages);
		startTransition(async () => {
			setOptimisticPage(nextPage);
			const result = await getPatientImmunizationsTableAction({
				patientId,
				page: nextPage,
				limit: tableData.limit,
				query,
			});

			setTableData({
				rows: result.immunizations,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	function handleLimitChange(nextLimit: number) {
		startTransition(async () => {
			setOptimisticPage(1);
			setOptimisticLimit(nextLimit);
			const result = await getPatientImmunizationsTableAction({
				patientId,
				page: 1,
				limit: nextLimit,
				query,
			});

			setTableData({
				rows: result.immunizations,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	return (
		<ImmunizationsTable
			immunizations={tableData.rows}
			page={optimisticPage}
			limit={optimisticLimit}
			totalPages={tableData.totalPages}
			query={query}
			isPending={isPending}
			onQueryChange={handleQueryChange}
			onPreviousPage={handlePreviousPage}
			onNextPage={handleNextPage}
			onLimitChange={handleLimitChange}
		/>
	);
}

export function ProceduresClient({
	patientId,
	procedures,
	page,
	limit,
	totalPages,
}: {
	patientId: string;
	procedures: ProcedureType[];
	page: number;
	limit: number;
	totalPages: number;
}) {
	const [tableData, setTableData] = useState<SectionTableState<ProcedureType>>({
		rows: procedures,
		page,
		limit,
		totalPages,
	});
	const [optimisticPage, setOptimisticPage] = useOptimistic(tableData.page);
	const [optimisticLimit, setOptimisticLimit] = useOptimistic(tableData.limit);
	const [query, setQuery] = useState("");
	const [isPending, startTransition] = useTransition();
	const debouncedSearch = useDebouncedCallback((nextQuery: string) => {
		startTransition(async () => {
			setOptimisticPage(1);

			const result = await getPatientProceduresTableAction({
				patientId,
				page: 1,
				limit: tableData.limit,
				query: nextQuery,
			});

			setTableData({
				rows: result.procedures,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}, 300);

	function handleQueryChange(nextQuery: string) {
		setQuery(nextQuery);
		debouncedSearch(nextQuery);
	}

	function handlePreviousPage() {
		const nextPage = Math.max(tableData.page - 1, 1);
		startTransition(async () => {
			setOptimisticPage(nextPage);
			const result = await getPatientProceduresTableAction({
				patientId,
				page: nextPage,
				limit: tableData.limit,
				query,
			});

			setTableData({
				rows: result.procedures,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	function handleNextPage() {
		const nextPage = Math.min(tableData.page + 1, tableData.totalPages);
		startTransition(async () => {
			setOptimisticPage(nextPage);
			const result = await getPatientProceduresTableAction({
				patientId,
				page: nextPage,
				limit: tableData.limit,
				query,
			});

			setTableData({
				rows: result.procedures,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	function handleLimitChange(nextLimit: number) {
		startTransition(async () => {
			setOptimisticPage(1);
			setOptimisticLimit(nextLimit);
			const result = await getPatientProceduresTableAction({
				patientId,
				page: 1,
				limit: nextLimit,
				query,
			});

			setTableData({
				rows: result.procedures,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	return (
		<ProceduresTable
			procedures={tableData.rows}
			page={optimisticPage}
			limit={optimisticLimit}
			totalPages={tableData.totalPages}
			query={query}
			isPending={isPending}
			onQueryChange={handleQueryChange}
			onPreviousPage={handlePreviousPage}
			onNextPage={handleNextPage}
			onLimitChange={handleLimitChange}
		/>
	);
}

export function MedicationsClient({
	patientId,
	medications,
	page,
	limit,
	totalPages,
}: {
	patientId: string;
	medications: MedicationType[];
	page: number;
	limit: number;
	totalPages: number;
}) {
	const [tableData, setTableData] = useState<SectionTableState<MedicationType>>({
		rows: medications,
		page,
		limit,
		totalPages,
	});
	const [optimisticPage, setOptimisticPage] = useOptimistic(tableData.page);
	const [optimisticLimit, setOptimisticLimit] = useOptimistic(tableData.limit);
	const [query, setQuery] = useState("");
	const [isPending, startTransition] = useTransition();
	const debouncedSearch = useDebouncedCallback((nextQuery: string) => {
		startTransition(async () => {
			setOptimisticPage(1);

			const result = await getPatientMedicationsTableAction({
				patientId,
				page: 1,
				limit: tableData.limit,
				query: nextQuery,
			});

			setTableData({
				rows: result.medications,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}, 300);

	function handleQueryChange(nextQuery: string) {
		setQuery(nextQuery);
		debouncedSearch(nextQuery);
	}

	function handlePreviousPage() {
		const nextPage = Math.max(tableData.page - 1, 1);
		startTransition(async () => {
			setOptimisticPage(nextPage);
			const result = await getPatientMedicationsTableAction({
				patientId,
				page: nextPage,
				limit: tableData.limit,
				query,
			});

			setTableData({
				rows: result.medications,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	function handleNextPage() {
		const nextPage = Math.min(tableData.page + 1, tableData.totalPages);
		startTransition(async () => {
			setOptimisticPage(nextPage);
			const result = await getPatientMedicationsTableAction({
				patientId,
				page: nextPage,
				limit: tableData.limit,
				query,
			});

			setTableData({
				rows: result.medications,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	function handleLimitChange(nextLimit: number) {
		startTransition(async () => {
			setOptimisticPage(1);
			setOptimisticLimit(nextLimit);
			const result = await getPatientMedicationsTableAction({
				patientId,
				page: 1,
				limit: nextLimit,
				query,
			});

			setTableData({
				rows: result.medications,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	return (
		<MedicationsTable
			medications={tableData.rows}
			page={optimisticPage}
			limit={optimisticLimit}
			totalPages={tableData.totalPages}
			query={query}
			isPending={isPending}
			onQueryChange={handleQueryChange}
			onPreviousPage={handlePreviousPage}
			onNextPage={handleNextPage}
			onLimitChange={handleLimitChange}
		/>
	);
}

export function EncountersClient({
	patientId,
	encounters,
	page,
	limit,
	totalPages,
}: {
	patientId: string;
	encounters: EncounterType[];
	page: number;
	limit: number;
	totalPages: number;
}) {
	const [tableData, setTableData] = useState<SectionTableState<EncounterType>>({
		rows: encounters,
		page,
		limit,
		totalPages,
	});
	const [optimisticPage, setOptimisticPage] = useOptimistic(tableData.page);
	const [optimisticLimit, setOptimisticLimit] = useOptimistic(tableData.limit);
	const [query, setQuery] = useState("");
	const [isPending, startTransition] = useTransition();
	const debouncedSearch = useDebouncedCallback((nextQuery: string) => {
		startTransition(async () => {
			setOptimisticPage(1);

			const result = await getPatientEncountersTableAction({
				patientId,
				page: 1,
				limit: tableData.limit,
				query: nextQuery,
			});

			setTableData({
				rows: result.encounters,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}, 300);

	function handleQueryChange(nextQuery: string) {
		setQuery(nextQuery);
		debouncedSearch(nextQuery);
	}

	function handlePreviousPage() {
		const nextPage = Math.max(tableData.page - 1, 1);
		startTransition(async () => {
			setOptimisticPage(nextPage);
			const result = await getPatientEncountersTableAction({
				patientId,
				page: nextPage,
				limit: tableData.limit,
				query,
			});

			setTableData({
				rows: result.encounters,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	function handleNextPage() {
		const nextPage = Math.min(tableData.page + 1, tableData.totalPages);
		startTransition(async () => {
			setOptimisticPage(nextPage);
			const result = await getPatientEncountersTableAction({
				patientId,
				page: nextPage,
				limit: tableData.limit,
				query,
			});

			setTableData({
				rows: result.encounters,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	function handleLimitChange(nextLimit: number) {
		startTransition(async () => {
			setOptimisticPage(1);
			setOptimisticLimit(nextLimit);
			const result = await getPatientEncountersTableAction({
				patientId,
				page: 1,
				limit: nextLimit,
				query,
			});

			setTableData({
				rows: result.encounters,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	return (
		<EncountersTable
			patientId={patientId}
			encounters={tableData.rows}
			page={optimisticPage}
			limit={optimisticLimit}
			totalPages={tableData.totalPages}
			query={query}
			isPending={isPending}
			onQueryChange={handleQueryChange}
			onPreviousPage={handlePreviousPage}
			onNextPage={handleNextPage}
			onLimitChange={handleLimitChange}
		/>
	);
}

export function LabTestsClient({
	patientId,
	labTests,
	page,
	limit,
	totalPages,
}: {
	patientId: string;
	labTests: LabTestType[];
	page: number;
	limit: number;
	totalPages: number;
}) {
	const [tableData, setTableData] = useState<SectionTableState<LabTestType>>({
		rows: labTests,
		page,
		limit,
		totalPages,
	});
	const [optimisticPage, setOptimisticPage] = useOptimistic(tableData.page);
	const [optimisticLimit, setOptimisticLimit] = useOptimistic(tableData.limit);
	const [query, setQuery] = useState("");
	const [isPending, startTransition] = useTransition();
	const debouncedSearch = useDebouncedCallback((nextQuery: string) => {
		startTransition(async () => {
			setOptimisticPage(1);

			const result = await getPatientLabTestsTableAction({
				patientId,
				page: 1,
				limit: tableData.limit,
				query: nextQuery,
			});

			setTableData({
				rows: result.labTests,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}, 300);

	function handleQueryChange(nextQuery: string) {
		setQuery(nextQuery);
		debouncedSearch(nextQuery);
	}

	function handlePreviousPage() {
		const nextPage = Math.max(tableData.page - 1, 1);
		startTransition(async () => {
			setOptimisticPage(nextPage);
			const result = await getPatientLabTestsTableAction({
				patientId,
				page: nextPage,
				limit: tableData.limit,
				query,
			});

			setTableData({
				rows: result.labTests,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	function handleNextPage() {
		const nextPage = Math.min(tableData.page + 1, tableData.totalPages);
		startTransition(async () => {
			setOptimisticPage(nextPage);
			const result = await getPatientLabTestsTableAction({
				patientId,
				page: nextPage,
				limit: tableData.limit,
				query,
			});

			setTableData({
				rows: result.labTests,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	function handleLimitChange(nextLimit: number) {
		startTransition(async () => {
			setOptimisticPage(1);
			setOptimisticLimit(nextLimit);
			const result = await getPatientLabTestsTableAction({
				patientId,
				page: 1,
				limit: nextLimit,
				query,
			});

			setTableData({
				rows: result.labTests,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	return (
		<LabTestsTable
			patientId={patientId}
			labTests={tableData.rows}
			page={optimisticPage}
			limit={optimisticLimit}
			totalPages={tableData.totalPages}
			query={query}
			isPending={isPending}
			onQueryChange={handleQueryChange}
			onPreviousPage={handlePreviousPage}
			onNextPage={handleNextPage}
			onLimitChange={handleLimitChange}
		/>
	);
}

export function ImagingClient({
	patientId,
	imagingStudies,
	page,
	limit,
	totalPages,
}: {
	patientId: string;
	imagingStudies: ImagingType[];
	page: number;
	limit: number;
	totalPages: number;
}) {
	const [tableData, setTableData] = useState<SectionTableState<ImagingType>>({
		rows: imagingStudies,
		page,
		limit,
		totalPages,
	});
	const [optimisticPage, setOptimisticPage] = useOptimistic(tableData.page);
	const [optimisticLimit, setOptimisticLimit] = useOptimistic(tableData.limit);
	const [query, setQuery] = useState("");
	const [isPending, startTransition] = useTransition();
	const debouncedSearch = useDebouncedCallback((nextQuery: string) => {
		startTransition(async () => {
			setOptimisticPage(1);

			const result = await getPatientImagingTableAction({
				patientId,
				page: 1,
				limit: tableData.limit,
				query: nextQuery,
			});

			setTableData({
				rows: result.imagingStudies,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}, 300);

	function handleQueryChange(nextQuery: string) {
		setQuery(nextQuery);
		debouncedSearch(nextQuery);
	}

	function handlePreviousPage() {
		const nextPage = Math.max(tableData.page - 1, 1);
		startTransition(async () => {
			setOptimisticPage(nextPage);
			const result = await getPatientImagingTableAction({
				patientId,
				page: nextPage,
				limit: tableData.limit,
				query,
			});

			setTableData({
				rows: result.imagingStudies,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	function handleNextPage() {
		const nextPage = Math.min(tableData.page + 1, tableData.totalPages);
		startTransition(async () => {
			setOptimisticPage(nextPage);
			const result = await getPatientImagingTableAction({
				patientId,
				page: nextPage,
				limit: tableData.limit,
				query,
			});

			setTableData({
				rows: result.imagingStudies,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	function handleLimitChange(nextLimit: number) {
		startTransition(async () => {
			setOptimisticPage(1);
			setOptimisticLimit(nextLimit);
			const result = await getPatientImagingTableAction({
				patientId,
				page: 1,
				limit: nextLimit,
				query,
			});

			setTableData({
				rows: result.imagingStudies,
				page: result.page,
				limit: result.limit,
				totalPages: result.totalPages,
			});
		});
	}

	return (
		<ImagingTable
			imagingStudies={tableData.rows}
			page={optimisticPage}
			limit={optimisticLimit}
			totalPages={tableData.totalPages}
			query={query}
			isPending={isPending}
			onQueryChange={handleQueryChange}
			onPreviousPage={handlePreviousPage}
			onNextPage={handleNextPage}
			onLimitChange={handleLimitChange}
		/>
	);
}
