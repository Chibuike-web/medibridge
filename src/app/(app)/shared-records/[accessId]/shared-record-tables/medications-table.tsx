"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import {
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiShare2Line,
  RiEyeLine,
  RiFilter3Line,
  RiMore2Fill,
  RiSearchLine,
  RiCloseLine,
  RiArrowRightLine,
  RiCalendarLine,
  RiCheckLine,
  RiCheckboxCircleLine,
} from "@remixicon/react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { CopyIdButton } from "@/components/copy-id-button";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils/cn";
import { parseDateParam } from "@/lib/utils/parse-date-param";
import { endOfDay, format, isSameDay, startOfDay, subDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import { useDebouncedCallback } from "@/hooks/use-debounced";
import { getSharedMedicationsTableAction } from "../shared-record-table-actions";

type MedicationFilterSubmenu = "status" | "created-at";
const medicationStatusFilterOptions = [
  { label: "Active", value: "Active" },
  { label: "Completed", value: "Completed" },
  { label: "Discontinued", value: "Discontinued" },
] as const;
const medicationDateFilterPresets = [
  {
    label: "Today",
    getRange: (today: Date) => ({
      from: startOfDay(today),
      to: endOfDay(today),
    }),
  },
  {
    label: "Last 7 days",
    getRange: (today: Date) => ({
      from: startOfDay(subDays(today, 6)),
      to: endOfDay(today),
    }),
  },
  {
    label: "Last 30 days",
    getRange: (today: Date) => ({
      from: startOfDay(subDays(today, 29)),
      to: endOfDay(today),
    }),
  },
];

export type SharedMedicationRow = {
  medication: string;
  dose: string;
  route: string;
  indication: string;
  medicationId: string;
  createdAt: string;
  createdAtValue: string;
  status: "Active" | "Completed" | "Discontinued";
};

export function SharedMedicationsTable({
  accessId,
  rows,
}: {
  accessId: string;
  rows: SharedMedicationRow[];
}) {
  const [tableRows, setTableRows] = useState(rows);
  const [recordSearchQuery, setRecordSearchQuery] = useState("");
  const [statusFilters, setStatusFilters] = useState<
    SharedMedicationRow["status"][]
  >([]);
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [activeFilterSubmenu, setActiveFilterSubmenu] =
    useState<MedicationFilterSubmenu | null>(null);
  const [isPending, startTransition] = useTransition();
  const latestRequestIdRef = useRef(0);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "medication", desc: false },
  ]);
  function refreshTable({
    nextQuery = recordSearchQuery,
    nextStatusFilters = statusFilters,
    nextCreatedFrom = createdFrom,
    nextCreatedTo = createdTo,
  }: {
    nextQuery?: string;
    nextStatusFilters?: SharedMedicationRow["status"][];
    nextCreatedFrom?: string;
    nextCreatedTo?: string;
  }) {
    const requestId = ++latestRequestIdRef.current;
    startTransition(async () => {
      const nextRows = await getSharedMedicationsTableAction({
        accessId,
        query: nextQuery,
        statusFilters: nextStatusFilters,
        createdFrom: nextCreatedFrom,
        createdTo: nextCreatedTo,
      });
      if (latestRequestIdRef.current === requestId) setTableRows(nextRows);
    });
  }
  const debouncedSearch = useDebouncedCallback(
    (nextQuery: string) => refreshTable({ nextQuery }),
    300,
  );
  function handleQueryChange(nextQuery: string) {
    setRecordSearchQuery(nextQuery);
    debouncedSearch(nextQuery);
  }
  function handleStatusFiltersChange(
    nextStatusFilters: SharedMedicationRow["status"][],
  ) {
    setStatusFilters(nextStatusFilters);
    refreshTable({ nextStatusFilters });
  }
  function handleCreatedAtRangeApply(
    nextCreatedFrom: string,
    nextCreatedTo: string,
  ) {
    setCreatedFrom(nextCreatedFrom);
    setCreatedTo(nextCreatedTo);
    refreshTable({ nextCreatedFrom, nextCreatedTo });
  }
  const columns = useMemo<ColumnDef<SharedMedicationRow>[]>(
    () => [
      {
        id: "select",
        header: () => <Checkbox aria-label="Select all medications" disabled />,
        cell: ({ row }) => (
          <Checkbox aria-label={`Select ${row.original.medication}`} disabled />
        ),
        enableSorting: false,
        size: 40,
      },
      {
        header: "Medication",
        accessorKey: "medication",
        enableSorting: true,
        cell: ({ row }) => (
          <span className="font-medium">{row.original.medication}</span>
        ),
      },
      { header: "Dose", accessorKey: "dose", enableSorting: true },
      { header: "Route", accessorKey: "route", enableSorting: true },
      { header: "Indication", accessorKey: "indication", enableSorting: true },
      {
        header: "Medication ID",
        accessorKey: "medicationId",
        enableSorting: false,
        cell: ({ row }) => <CopyIdButton id={row.original.medicationId} />,
      },
      { header: "Created At", accessorKey: "createdAt", enableSorting: true },
      {
        header: "Status",
        accessorKey: "status",
        enableSorting: true,
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        cell: () => <RowMenu />,
        enableSorting: false,
        size: 40,
      },
    ],
    [],
  );
  const table = useReactTable({
    data: tableRows,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
  });

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900">Medications</h2>
      <div className="mt-7 mb-4 flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <RiSearchLine className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            value={recordSearchQuery}
            onChange={(event) => handleQueryChange(event.target.value)}
            placeholder="Search by medication, dose, route, indication, or medication ID"
            className="pl-10"
          />
        </div>
        <MedicationFilterMenu
          activeFilterSubmenu={activeFilterSubmenu}
          statusFilters={statusFilters}
          createdFrom={createdFrom}
          createdTo={createdTo}
          isPending={isPending}
          onActiveFilterSubmenuChange={setActiveFilterSubmenu}
          onStatusFiltersChange={handleStatusFiltersChange}
          onCreatedAtRangeApply={handleCreatedAtRangeApply}
        />
        <Button
          type="button"
          variant="outline"
          className="border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 data-[state=open]:border-gray-400 data-[state=open]:ring-4 data-[state=open]:ring-gray-200"
        >
          <RiShare2Line aria-hidden="true" />
          Export
        </Button>
      </div>
      {statusFilters.length > 0 || createdFrom || createdTo ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {statusFilters.map((status) => (
            <FilterPill
              key={status}
              label={`Status: ${status}`}
              onRemove={() =>
                handleStatusFiltersChange(
                  statusFilters.filter((value) => value !== status),
                )
              }
            />
          ))}
          {createdFrom || createdTo ? (
            <FilterPill
              label={`Created: ${formatDateRangeFilterLabel(createdFrom, createdTo)}`}
              onRemove={() => handleCreatedAtRangeApply("", "")}
            />
          ) : null}
        </div>
      ) : null}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-gray-50 hover:bg-gray-50"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    tabIndex={header.column.getCanSort() ? 0 : undefined}
                    aria-sort={
                      header.column.getCanSort()
                        ? header.column.getIsSorted() === "asc"
                          ? "ascending"
                          : header.column.getIsSorted() === "desc"
                            ? "descending"
                            : "none"
                        : undefined
                    }
                    onClick={
                      header.column.getCanSort()
                        ? header.column.getToggleSortingHandler()
                        : undefined
                    }
                    onKeyDown={(event) => {
                      if (
                        header.column.getCanSort() &&
                        (event.key === "Enter" || event.key === " ")
                      ) {
                        event.preventDefault();
                        header.column.getToggleSortingHandler()?.(event);
                      }
                    }}
                    className={cn(
                      "h-10 whitespace-nowrap bg-gray-50 px-3 py-0 text-gray-600",
                      header.column.id === "dose" && "text-right",
                      header.column.getCanSort() &&
                        "cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-400",
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-3",
                        header.column.id === "dose"
                          ? "justify-end"
                          : "justify-between",
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                      {header.column.getCanSort() ? (
                        <div className="-space-y-2">
                          <RiArrowUpSLine
                            className={cn(
                              "size-4 text-gray-800",
                              header.column.getIsSorted() === "desc"
                                ? "opacity-30"
                                : "",
                            )}
                            aria-hidden="true"
                          />
                          <RiArrowDownSLine
                            className={cn(
                              "size-4 text-gray-800",
                              header.column.getIsSorted() === "asc"
                                ? "opacity-30"
                                : "",
                            )}
                            aria-hidden="true"
                          />
                        </div>
                      ) : null}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        cell.column.id === "dose" && "text-right",
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 bg-white px-3 py-0 text-center text-sm text-gray-500"
                >
                  No matching medications found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function MedicationFilterMenu({
  activeFilterSubmenu,
  statusFilters,
  createdFrom,
  createdTo,
  isPending,
  onActiveFilterSubmenuChange,
  onStatusFiltersChange,
  onCreatedAtRangeApply,
}: {
  activeFilterSubmenu: MedicationFilterSubmenu | null;
  statusFilters: SharedMedicationRow["status"][];
  createdFrom: string;
  createdTo: string;
  isPending: boolean;
  onActiveFilterSubmenuChange: (
    submenu: MedicationFilterSubmenu | null,
  ) => void;
  onStatusFiltersChange: (values: SharedMedicationRow["status"][]) => void;
  onCreatedAtRangeApply: (from: string, to: string) => void;
}) {
  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (!open) onActiveFilterSubmenuChange(null);
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 data-[state=open]:border-gray-400 data-[state=open]:ring-4 data-[state=open]:ring-gray-200"
        >
          <RiFilter3Line aria-hidden="true" />
          Filter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[13.75rem] rounded-xl border-gray-200 bg-white text-sm text-gray-700 shadow-xl"
      >
        <DropdownMenuSub
          open={activeFilterSubmenu === "status"}
          onOpenChange={(open) =>
            onActiveFilterSubmenuChange(open ? "status" : null)
          }
        >
          <DropdownMenuSubTrigger className="rounded-lg py-2 focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100">
            <RiCheckboxCircleLine className="size-4.5" />
            <span>Status</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent
            alignOffset={-5}
            className="w-[13.75rem] rounded-xl border border-gray-200 bg-white p-1 text-sm text-gray-700 shadow-xl"
          >
            <CheckboxFilterList
              name="shared-medication-status"
              options={medicationStatusFilterOptions}
              selectedValues={statusFilters}
              isPending={isPending}
              onSelectedValuesChange={onStatusFiltersChange}
            />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub
          open={activeFilterSubmenu === "created-at"}
          onOpenChange={(open) =>
            onActiveFilterSubmenuChange(open ? "created-at" : null)
          }
        >
          <DropdownMenuSubTrigger className="rounded-lg py-2 focus:bg-gray-100 focus:text-gray-900 data-[state=open]:bg-gray-100">
            <RiCalendarLine className="size-4.5" />
            <span>Created at</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent
            alignOffset={-5}
            className="w-max max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white p-0 text-sm text-gray-700 shadow-xl"
          >
            <DateFilterContent
              from={createdFrom}
              to={createdTo}
              isPending={isPending}
              onDateRangeApply={onCreatedAtRangeApply}
            />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FilterPill({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-gray-100 py-1.5 pr-1.5 pl-3 text-sm font-medium text-gray-600 shadow-xs">
      <span>{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="flex size-5 items-center justify-center rounded-full bg-gray-800 text-white transition hover:bg-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
        aria-label={`Remove ${label} filter`}
      >
        <RiCloseLine className="size-4" aria-hidden="true" />
      </button>
    </span>
  );
}

function CheckboxFilterList<TValue extends string>({
  name,
  options,
  selectedValues,
  isPending,
  onSelectedValuesChange,
}: {
  name: string;
  options: readonly { label: string; value: TValue }[];
  selectedValues: TValue[];
  isPending: boolean;
  onSelectedValuesChange: (values: TValue[]) => void;
}) {
  return options.map((option) => {
    const selected = selectedValues.includes(option.value);
    const id = `${name}-${option.value}`;
    return (
      <DropdownMenuItem
        key={option.value}
        className="rounded-lg p-0 focus:bg-gray-100 focus:text-gray-900"
        onSelect={(event) => event.preventDefault()}
      >
        <Label
          htmlFor={id}
          className="flex w-full cursor-pointer items-center gap-3 px-2 py-2 leading-normal font-normal"
        >
          <Checkbox
            id={id}
            checked={selected}
            disabled={isPending}
            onCheckedChange={(checked) =>
              onSelectedValuesChange(
                checked === true
                  ? [...selectedValues, option.value]
                  : selectedValues.filter((value) => value !== option.value),
              )
            }
            className="[&_svg]:!text-current"
          />
          <span>{option.label}</span>
        </Label>
      </DropdownMenuItem>
    );
  });
}
function DateFilterContent({
  from,
  to,
  isPending,
  onDateRangeApply,
}: {
  from: string;
  to: string;
  isPending: boolean;
  onDateRangeApply: (from: string, to: string) => void;
}) {
  return (
    <div className="flex w-max">
      <div className="flex w-50 shrink-0 flex-col p-1 text-sm text-gray-600">
        <DatePresetList
          from={from}
          to={to}
          onDateRangeApply={onDateRangeApply}
        />
      </div>
      <div className="w-88 shrink-0 border-l border-gray-100 p-3">
        <CustomRangeCalendarPanel
          key={`${from}:${to}`}
          from={from}
          to={to}
          isPending={isPending}
          onDateRangeApply={onDateRangeApply}
        />
      </div>
    </div>
  );
}
function DatePresetList({
  from,
  to,
  onDateRangeApply,
}: {
  from: string;
  to: string;
  onDateRangeApply: (from: string, to: string) => void;
}) {
  const selected = getDateRangeFromParams(from, to);
  const today = new Date();
  return medicationDateFilterPresets.map((preset) => {
    const range = preset.getRange(today);
    const isSelected = Boolean(
      selected?.from &&
        selected.to &&
        isSameDay(selected.from, range.from) &&
        isSameDay(selected.to, range.to),
    );
    return (
      <DropdownMenuItem
        key={preset.label}
        onSelect={(event) => {
          event.preventDefault();
          onDateRangeApply(formatUrlDate(range.from), formatUrlDate(range.to));
        }}
        className="flex h-9 w-full items-center justify-between rounded-lg px-3 text-left font-medium text-gray-700 focus:bg-gray-50"
      >
        <span>{preset.label}</span>
        {isSelected ? (
          <RiCheckLine className="size-5 text-gray-700" aria-hidden />
        ) : null}
      </DropdownMenuItem>
    );
  });
}
function CustomRangeCalendarPanel({
  from,
  to,
  isPending,
  onDateRangeApply,
}: {
  from: string;
  to: string;
  isPending: boolean;
  onDateRangeApply: (from: string, to: string) => void;
}) {
  const [draftRange, setDraftRange] = useState<DateRange | undefined>(
    getDateRangeFromParams(from, to),
  );
  return (
    <div className="flex min-w-0 flex-col">
      <div className="flex items-center gap-3">
        <DateField value={draftRange?.from} label="Start date" />
        <RiArrowRightLine
          className="size-5 shrink-0 text-gray-400"
          aria-hidden
        />
        <DateField value={draftRange?.to} label="End date" />
      </div>
      <Calendar
        mode="range"
        selected={draftRange}
        onSelect={setDraftRange}
        numberOfMonths={1}
        className="mt-4 p-0"
        classNames={{
          month_caption: "flex h-9 w-full items-center justify-center px-9",
          caption_label: "text-sm font-semibold text-gray-800",
          weekday:
            "flex-1 rounded-md text-sm font-medium text-gray-700 select-none",
          day_button: "rounded-lg text-sm",
        }}
        disabled={isPending}
      />
      <div className="mt-7 flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          className="min-w-28 text-sm"
          disabled={isPending}
          onClick={() => {
            setDraftRange(undefined);
            onDateRangeApply("", "");
          }}
        >
          Reset
        </Button>
        <Button
          type="button"
          className="min-w-40 flex-1 text-sm"
          disabled={!draftRange?.from || !draftRange?.to || isPending}
          onClick={() => {
            if (draftRange?.from && draftRange.to)
              onDateRangeApply(
                formatUrlDate(draftRange.from),
                formatUrlDate(draftRange.to),
              );
          }}
        >
          Apply
        </Button>
      </div>
    </div>
  );
}
function DateField({ label, value }: { label: string; value?: Date }) {
  return (
    <div className="flex h-9 min-w-0 flex-1 items-center gap-3 rounded-lg border border-gray-200 bg-white px-2 text-left text-sm font-medium text-gray-500">
      <RiCalendarLine className="size-5 shrink-0 text-gray-400" aria-hidden />
      <span className="sr-only">{label}</span>
      <span className="truncate">
        {value ? format(value, "dd/MM/yyyy") : "DD/MM/YYYY"}
      </span>
    </div>
  );
}
function getDateRangeFromParams(
  from: string,
  to: string,
): DateRange | undefined {
  const fromDate = parseDateParam(from);
  const toDate = parseDateParam(to);
  return fromDate || toDate ? { from: fromDate, to: toDate } : undefined;
}
function formatDateRangeFilterLabel(from: string, to: string) {
  const fromDate = parseDateParam(from);
  const toDate = parseDateParam(to);
  if (fromDate && toDate)
    return `${format(fromDate, "MMM d, yyyy")} - ${format(toDate, "MMM d, yyyy")}`;
  if (fromDate) return `From ${format(fromDate, "MMM d, yyyy")}`;
  if (toDate) return `Until ${format(toDate, "MMM d, yyyy")}`;
  return "Any date";
}
function formatUrlDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function RowMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        className="inline-flex size-9 items-center justify-center rounded-md border border-transparent text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
        aria-label="Open medication actions"
      >
        <RiMore2Fill className="size-5" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[13.75rem] rounded-xl border-white/20 bg-gray-800 text-sm text-white ring ring-gray-800"
      >
        <DropdownMenuItem className="gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
          <RiEyeLine className="text-white" aria-hidden="true" />
          <span>View details</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-3 rounded-lg text-white focus:bg-white/10 focus:text-white py-2">
          <RiShare2Line className="text-white" aria-hidden="true" />
          <span>Export</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
