"use client";

import { useState } from "react";
import { format, parseISO, subDays, subMonths, subYears } from "date-fns";
import {
	RiArrowLeftSLine,
	RiArrowRightSLine,
	RiCalendarLine,
	RiCloseLine,
	RiDeleteBin2Line,
	RiLinkM,
	RiMailLine,
	RiMailSendLine,
	RiMore2Fill,
	RiSearchLine,
	RiShieldUserLine,
} from "@remixicon/react";

import { ExportButton } from "@/components/export-button";
import { FilterGroup, FilterPopover } from "@/components/filter-menu";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils/cn";
import { getInitials } from "@/lib/utils/get-initials";

import { InviteMembersDialog } from "./invite-members-dialog";
import { ReviewInvitationsDialog } from "./review-invitations-dialog";
import type {
	InviteMemberRow,
	MemberManagerRole,
	OrganizationRole,
	SettingsDialogUser,
} from "./types";

const ROWS_PER_PAGE_OPTIONS = [14, 28, 42];

type InviteStatus = "pending" | "accepted" | "cancelled";

type OrganizationMemberRow = {
	id: string;
	name: string | null;
	email: string;
	inviteStatus: InviteStatus;
	role: OrganizationRole;
	joinedOn: string | null;
	lastActiveOn: string | null;
	isCurrentUser?: boolean;
};

const ownerRow: OrganizationMemberRow = {
	id: "john-doe",
	name: "John Doe",
	email: "john@example.com",
	inviteStatus: "accepted",
	role: "owner",
	joinedOn: "2025-09-10",
	lastActiveOn: "2026-11-07",
};

const otherMemberRows: OrganizationMemberRow[] = [
	{
		id: "sarah-williams",
		name: "Sarah Williams",
		email: "sarah@example.com",
		inviteStatus: "accepted",
		role: "admin",
		joinedOn: "2026-08-12",
		lastActiveOn: "2026-11-04",
	},
	{
		id: "david-okafor",
		name: "David Okafor",
		email: "david@example.com",
		inviteStatus: "accepted",
		role: "member",
		joinedOn: "2026-10-28",
		lastActiveOn: "2026-10-20",
	},
	{
		id: "grace-nwosu-invitation",
		name: null,
		email: "grace@example.com",
		inviteStatus: "pending",
		role: "member",
		joinedOn: null,
		lastActiveOn: null,
	},
	{
		id: "tunde-bello-invitation",
		name: null,
		email: "tunde@example.com",
		inviteStatus: "cancelled",
		role: "admin",
		joinedOn: null,
		lastActiveOn: null,
	},
];

export function MembersSettings({
	currentUser,
	organizationName,
	viewerRole,
}: {
	currentUser: SettingsDialogUser;
	organizationName: string;
	viewerRole: MemberManagerRole;
}) {
	const [memberQuery, setMemberQuery] = useState("");
	const [inviteStatusFilter, setInviteStatusFilter] = useState<InviteStatus | "">("");
	const [roleFilter, setRoleFilter] = useState<OrganizationRole | "">("");
	const [lastActiveSince, setLastActiveSince] = useState("");
	const [joinedSince, setJoinedSince] = useState("");
	const [memberPage, setMemberPage] = useState(1);
	const [memberLimit, setMemberLimit] = useState(ROWS_PER_PAGE_OPTIONS[0]);
	const [isInviteMembersDialogOpen, setIsInviteMembersDialogOpen] = useState(false);
	const [isReviewInvitationsDialogOpen, setIsReviewInvitationsDialogOpen] = useState(false);
	const [inviteMemberRows, setInviteMemberRows] = useState<InviteMemberRow[]>([
		{ id: crypto.randomUUID(), email: "", role: "" },
	]);

	const currentUserRow: OrganizationMemberRow = {
		id: "current-user",
		name: currentUser.name,
		email: currentUser.email,
		inviteStatus: "accepted",
		role: viewerRole,
		joinedOn: "2026-06-02",
		lastActiveOn: "2026-11-07",
		isCurrentUser: true,
	};
	const memberRows =
		viewerRole === "owner"
			? [currentUserRow, ...otherMemberRows]
			: [ownerRow, currentUserRow, ...otherMemberRows];
	const today = format(new Date(), "yyyy-MM-dd");
	const last7DaysStart = format(subDays(new Date(), 6), "yyyy-MM-dd");
	const last30DaysStart = format(subDays(new Date(), 29), "yyyy-MM-dd");
	const last90DaysStart = format(subDays(new Date(), 89), "yyyy-MM-dd");
	const last3MonthsStart = format(subMonths(new Date(), 3), "yyyy-MM-dd");
	const last6MonthsStart = format(subMonths(new Date(), 6), "yyyy-MM-dd");
	const lastYearStart = format(subYears(new Date(), 1), "yyyy-MM-dd");
	const normalizedMemberQuery = memberQuery.trim().toLowerCase();
	const matchingMemberRows = memberRows.filter(
		(row) =>
			`${row.name ?? ""} ${row.email}`.toLowerCase().includes(normalizedMemberQuery) &&
			(!inviteStatusFilter || row.inviteStatus === inviteStatusFilter) &&
			(!roleFilter || row.role === roleFilter) &&
			(!lastActiveSince || (row.lastActiveOn !== null && row.lastActiveOn >= lastActiveSince)) &&
			(!joinedSince || (row.joinedOn !== null && row.joinedOn >= joinedSince)),
	);
	const memberPageCount = Math.max(1, Math.ceil(matchingMemberRows.length / memberLimit));
	const visibleMemberRows = matchingMemberRows.slice(
		(memberPage - 1) * memberLimit,
		memberPage * memberLimit,
	);
	const fitsOnSmallestPage = matchingMemberRows.length <= ROWS_PER_PAGE_OPTIONS[0];

	return (
		<section aria-labelledby="members-heading" className="flex flex-col gap-4 px-4 py-5">
			<h3 id="members-heading" className="font-semibold">
				Members
			</h3>
			<div className="flex flex-wrap items-center gap-2">
				<div className="relative min-w-0 grow-[999] basis-60">
					<RiSearchLine className="pointer-events-none absolute bottom-0 left-2 flex h-full size-4 items-center justify-center text-gray-400" />
					<Input
						type="search"
						className="pl-8"
						aria-label="Search members"
						placeholder="Search by name or email"
						value={memberQuery}
						onChange={(event) => {
							setMemberQuery(event.target.value);
							setMemberPage(1);
						}}
					/>
				</div>
				<div className="flex grow flex-wrap items-center gap-2 max-md:w-full">
					<FilterGroup
						activeFilterCount={
							(inviteStatusFilter ? 1 : 0) +
							(roleFilter ? 1 : 0) +
							(lastActiveSince ? 1 : 0) +
							(joinedSince ? 1 : 0)
						}
					>
						<FilterPopover label="Invite status" icon={RiMailLine}>
							<RadioGroup
								value={inviteStatusFilter || "all"}
								onValueChange={(nextInviteStatus) => {
									setInviteStatusFilter(
										nextInviteStatus === "all" ? "" : (nextInviteStatus as InviteStatus),
									);
									setMemberPage(1);
								}}
								className="flex flex-col gap-0.5"
							>
								<div className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
									<RadioGroupItem value="all" id="member-invite-status-all" />
									<Label
										htmlFor="member-invite-status-all"
										className="w-full cursor-pointer leading-normal font-normal"
									>
										All
									</Label>
								</div>
								<div className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
									<RadioGroupItem value="pending" id="member-invite-status-pending" />
									<Label
										htmlFor="member-invite-status-pending"
										className="w-full cursor-pointer leading-normal font-normal"
									>
										Pending
									</Label>
								</div>
								<div className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
									<RadioGroupItem value="accepted" id="member-invite-status-accepted" />
									<Label
										htmlFor="member-invite-status-accepted"
										className="w-full cursor-pointer leading-normal font-normal"
									>
										Accepted
									</Label>
								</div>
								<div className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
									<RadioGroupItem value="cancelled" id="member-invite-status-cancelled" />
									<Label
										htmlFor="member-invite-status-cancelled"
										className="w-full cursor-pointer leading-normal font-normal"
									>
										Cancelled
									</Label>
								</div>
							</RadioGroup>
						</FilterPopover>
						<FilterPopover label="Role" icon={RiShieldUserLine}>
							<RadioGroup
								value={roleFilter || "all"}
								onValueChange={(nextRole) => {
									setRoleFilter(nextRole === "all" ? "" : (nextRole as OrganizationRole));
									setMemberPage(1);
								}}
								className="flex flex-col gap-0.5"
							>
								<div className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
									<RadioGroupItem value="all" id="member-role-all" />
									<Label
										htmlFor="member-role-all"
										className="w-full cursor-pointer leading-normal font-normal"
									>
										All
									</Label>
								</div>
								<div className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
									<RadioGroupItem value="owner" id="member-role-owner" />
									<Label
										htmlFor="member-role-owner"
										className="w-full cursor-pointer leading-normal font-normal"
									>
										Owner
									</Label>
								</div>
								<div className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
									<RadioGroupItem value="admin" id="member-role-admin" />
									<Label
										htmlFor="member-role-admin"
										className="w-full cursor-pointer leading-normal font-normal"
									>
										Admin
									</Label>
								</div>
								<div className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
									<RadioGroupItem value="member" id="member-role-member" />
									<Label
										htmlFor="member-role-member"
										className="w-full cursor-pointer leading-normal font-normal"
									>
										Member
									</Label>
								</div>
							</RadioGroup>
						</FilterPopover>
						<FilterPopover label="Last active" icon={RiCalendarLine}>
							<RadioGroup
								value={lastActiveSince || "any"}
								onValueChange={(nextStartDate) => {
									setLastActiveSince(nextStartDate === "any" ? "" : nextStartDate);
									setMemberPage(1);
								}}
								className="flex flex-col gap-0.5"
							>
								<div className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
									<RadioGroupItem value="any" id="member-last-active-any" />
									<Label
										htmlFor="member-last-active-any"
										className="w-full cursor-pointer leading-normal font-normal"
									>
										Any time
									</Label>
								</div>
								<div className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
									<RadioGroupItem value={today} id="member-last-active-today" />
									<Label
										htmlFor="member-last-active-today"
										className="w-full cursor-pointer leading-normal font-normal"
									>
										Today
									</Label>
								</div>
								<div className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
									<RadioGroupItem value={last7DaysStart} id="member-last-active-7-days" />
									<Label
										htmlFor="member-last-active-7-days"
										className="w-full cursor-pointer leading-normal font-normal"
									>
										Last 7 days
									</Label>
								</div>
								<div className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
									<RadioGroupItem value={last30DaysStart} id="member-last-active-30-days" />
									<Label
										htmlFor="member-last-active-30-days"
										className="w-full cursor-pointer leading-normal font-normal"
									>
										Last 30 days
									</Label>
								</div>
								<div className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
									<RadioGroupItem value={last90DaysStart} id="member-last-active-90-days" />
									<Label
										htmlFor="member-last-active-90-days"
										className="w-full cursor-pointer leading-normal font-normal"
									>
										Last 90 days
									</Label>
								</div>
							</RadioGroup>
						</FilterPopover>
						<FilterPopover label="Joined" icon={RiCalendarLine}>
							<RadioGroup
								value={joinedSince || "any"}
								onValueChange={(nextStartDate) => {
									setJoinedSince(nextStartDate === "any" ? "" : nextStartDate);
									setMemberPage(1);
								}}
								className="flex flex-col gap-0.5"
							>
								<div className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
									<RadioGroupItem value="any" id="member-joined-any" />
									<Label
										htmlFor="member-joined-any"
										className="w-full cursor-pointer leading-normal font-normal"
									>
										Any time
									</Label>
								</div>
								<div className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
									<RadioGroupItem value={last30DaysStart} id="member-joined-30-days" />
									<Label
										htmlFor="member-joined-30-days"
										className="w-full cursor-pointer leading-normal font-normal"
									>
										Last 30 days
									</Label>
								</div>
								<div className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
									<RadioGroupItem value={last3MonthsStart} id="member-joined-3-months" />
									<Label
										htmlFor="member-joined-3-months"
										className="w-full cursor-pointer leading-normal font-normal"
									>
										Last 3 months
									</Label>
								</div>
								<div className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
									<RadioGroupItem value={last6MonthsStart} id="member-joined-6-months" />
									<Label
										htmlFor="member-joined-6-months"
										className="w-full cursor-pointer leading-normal font-normal"
									>
										Last 6 months
									</Label>
								</div>
								<div className="flex h-8 items-center gap-2 rounded-lg px-2 hover:bg-gray-100">
									<RadioGroupItem value={lastYearStart} id="member-joined-year" />
									<Label
										htmlFor="member-joined-year"
										className="w-full cursor-pointer leading-normal font-normal"
									>
										Last year
									</Label>
								</div>
							</RadioGroup>
						</FilterPopover>
					</FilterGroup>
					<ExportButton />
					<Button
						type="button"
						className="flex-1"
						onClick={() => setIsInviteMembersDialogOpen(true)}
					>
						Invite member
					</Button>
				</div>
			</div>

			<div className="overflow-x-auto rounded-xl border border-gray-200">
				<Table className="min-w-[56rem] border-separate border-spacing-0 bg-gray-50 text-left">
					<TableHeader className="text-sm font-semibold text-gray-500">
						<TableRow>
							<TableHead className="h-10 bg-gray-50 px-3 py-0 whitespace-nowrap text-gray-600">
								Name
							</TableHead>
							<TableHead className="h-10 bg-gray-50 px-3 py-0 whitespace-nowrap text-gray-600">
								Email
							</TableHead>
							<TableHead className="h-10 bg-gray-50 px-3 py-0 whitespace-nowrap text-gray-600">
								Invite status
							</TableHead>
							<TableHead className="h-10 bg-gray-50 py-0 pr-3 pl-6.25 whitespace-nowrap text-gray-600">
								Role
							</TableHead>
							<TableHead className="h-10 bg-gray-50 px-3 py-0 whitespace-nowrap text-gray-600">
								Joined
							</TableHead>
							<TableHead className="h-10 bg-gray-50 px-3 py-0 whitespace-nowrap text-gray-600">
								Last active
							</TableHead>
							<TableHead className="h-10 w-14 bg-gray-50 px-3 py-0">
								<span className="sr-only">Actions</span>
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody className="overflow-hidden rounded-t-xl outline outline-gray-200">
						{visibleMemberRows.length ? (
							visibleMemberRows.map((row, rowPosition) => {
								const canManageRow = !row.isCurrentUser && row.role !== "owner";
								const rowLabel = row.name ?? row.email;

								return (
									<TableRow key={row.id} className="h-14">
										<TableCell
											className={cn(
												"h-14 border-b border-gray-200 bg-white px-3 py-0 text-sm text-gray-600",
												rowPosition === visibleMemberRows.length - 1 && "border-b-0",
												rowPosition === 0 && "rounded-tl-lg",
											)}
										>
											{row.name ? (
												<div className="flex w-max items-center gap-3">
													<Avatar className="size-8 border border-gray-200 bg-gray-100 text-gray-700">
														<AvatarFallback className="bg-gray-100 text-xs font-semibold text-gray-700">
															{getInitials(row.name)}
														</AvatarFallback>
													</Avatar>
													<span className="font-medium text-gray-800">
														{row.name}
														{row.isCurrentUser ? (
															<span className="font-normal text-gray-400"> (You)</span>
														) : null}
													</span>
												</div>
											) : (
												"—"
											)}
										</TableCell>
										<TableCell
											className={cn(
												"h-14 border-b border-gray-200 bg-white px-3 py-0 text-sm text-gray-600",
												rowPosition === visibleMemberRows.length - 1 && "border-b-0",
											)}
										>
											{row.email}
										</TableCell>
										<TableCell
											className={cn(
												"h-14 border-b border-gray-200 bg-white px-3 py-0 text-sm text-gray-600",
												rowPosition === visibleMemberRows.length - 1 && "border-b-0",
											)}
										>
											<StatusBadge status={row.inviteStatus} />
										</TableCell>
										<TableCell
											className={cn(
												"h-14 border-b border-gray-200 bg-white px-3 py-0 text-sm text-gray-600",
												rowPosition === visibleMemberRows.length - 1 && "border-b-0",
											)}
										>
											{canManageRow && row.inviteStatus !== "cancelled" ? (
												<Select defaultValue={row.role}>
													<SelectTrigger
														aria-label={`Role for ${rowLabel}`}
														className="border-transparent font-semibold text-gray-800 hover:bg-gray-100"
													>
														<SelectValue />
													</SelectTrigger>
													<SelectContent align="start" className="min-w-50">
														<SelectItem value="admin">Admin</SelectItem>
														<SelectItem value="member">Member</SelectItem>
													</SelectContent>
												</Select>
											) : (
												<span className="pl-3.25 capitalize">{row.role}</span>
											)}
										</TableCell>
										<TableCell
											className={cn(
												"h-14 border-b border-gray-200 bg-white px-3 py-0 text-sm whitespace-nowrap text-gray-600",
												rowPosition === visibleMemberRows.length - 1 && "border-b-0",
											)}
										>
											{row.joinedOn ? format(parseISO(row.joinedOn), "MMM d, yyyy") : "—"}
										</TableCell>
										<TableCell
											className={cn(
												"h-14 border-b border-gray-200 bg-white px-3 py-0 text-sm whitespace-nowrap text-gray-600",
												rowPosition === visibleMemberRows.length - 1 && "border-b-0",
											)}
										>
											{row.lastActiveOn ? format(parseISO(row.lastActiveOn), "MMM d, yyyy") : "—"}
										</TableCell>
										<TableCell
											className={cn(
												"h-14 border-b border-gray-200 bg-white px-3 py-0 text-right",
												rowPosition === visibleMemberRows.length - 1 && "border-b-0",
												rowPosition === 0 && "rounded-tr-lg",
											)}
										>
											{canManageRow ? (
												<DropdownMenu>
													<DropdownMenuTrigger
														type="button"
														className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md border border-transparent text-gray-500 transition hover:bg-gray-200 hover:text-gray-800 data-[state=open]:bg-gray-200 data-[state=open]:text-gray-800"
														aria-label={`Open actions for ${rowLabel}`}
													>
														<RiMore2Fill className="size-5" aria-hidden />
													</DropdownMenuTrigger>
													<DropdownMenuContent
														align="end"
														className="rounded-xl bg-white text-sm text-gray-700"
													>
														{row.inviteStatus === "pending" ? (
															<>
																<DropdownMenuItem className="rounded-lg">
																	<RiLinkM aria-hidden="true" />
																	<span>Copy link</span>
																</DropdownMenuItem>
																<DropdownMenuItem className="rounded-lg">
																	<RiMailSendLine aria-hidden="true" />
																	<span>Resend invitation</span>
																</DropdownMenuItem>
																<DropdownMenuSeparator />
																<DropdownMenuItem className="rounded-lg text-rose-600 focus:bg-rose-50 focus:text-rose-600">
																	<RiCloseLine className="text-current" aria-hidden="true" />
																	<span>Cancel invitation</span>
																</DropdownMenuItem>
															</>
														) : null}
														{row.inviteStatus === "cancelled" ? (
															<DropdownMenuItem className="rounded-lg text-rose-600 focus:bg-rose-50 focus:text-rose-600">
																<RiDeleteBin2Line className="text-current" aria-hidden="true" />
																<span>Remove invitation</span>
															</DropdownMenuItem>
														) : null}
														{row.inviteStatus === "accepted" ? (
															<DropdownMenuItem className="rounded-lg text-rose-600 focus:bg-rose-50 focus:text-rose-600">
																<RiDeleteBin2Line className="text-current" aria-hidden="true" />
																<span>Remove member</span>
															</DropdownMenuItem>
														) : null}
													</DropdownMenuContent>
												</DropdownMenu>
											) : null}
										</TableCell>
									</TableRow>
								);
							})
						) : (
							<TableRow>
								<TableCell
									colSpan={7}
									className="h-32 rounded-t-lg bg-white px-3 py-0 text-center text-sm text-gray-500"
								>
									No matching members found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
				{fitsOnSmallestPage ? null : (
					<div className="flex items-center justify-between gap-3 overflow-x-auto border-t border-gray-200 bg-white p-3 text-sm whitespace-nowrap text-gray-500">
						<div className="flex items-center gap-3">
							<span>Rows per page</span>
							<Select
								value={String(memberLimit)}
								onValueChange={(value) => {
									setMemberLimit(Number(value));
									setMemberPage(1);
								}}
							>
								<SelectTrigger className="h-8 w-16 bg-white px-2 text-gray-700">
									<SelectValue aria-label="Rows per page" placeholder="Rows" />
								</SelectTrigger>
								<SelectContent className="w-20" align="start">
									{ROWS_PER_PAGE_OPTIONS.map((pageSize) => (
										<SelectItem key={pageSize} value={String(pageSize)}>
											{pageSize}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex items-center gap-3">
							<span>
								Page {memberPage} of {memberPageCount}
							</span>
							<div className="flex items-center gap-2">
								<Button
									type="button"
									variant="outline"
									size="icon"
									aria-label="Previous"
									onClick={() => setMemberPage((prev) => prev - 1)}
									disabled={memberPage <= 1}
									className="text-gray-700 shadow-none"
								>
									<RiArrowLeftSLine aria-hidden="true" />
								</Button>
								<Button
									type="button"
									variant="outline"
									size="icon"
									aria-label="Next"
									onClick={() => setMemberPage((prev) => prev + 1)}
									disabled={memberPage >= memberPageCount}
									className="text-gray-700 shadow-none"
								>
									<RiArrowRightSLine aria-hidden="true" />
								</Button>
							</div>
						</div>
					</div>
				)}
			</div>

			<InviteMembersDialog
				open={isInviteMembersDialogOpen}
				onOpenChange={setIsInviteMembersDialogOpen}
				inviteMemberRows={inviteMemberRows}
				setInviteMemberRows={setInviteMemberRows}
				onContinue={() => {
					setIsInviteMembersDialogOpen(false);
					setIsReviewInvitationsDialogOpen(true);
				}}
			/>
			<ReviewInvitationsDialog
				open={isReviewInvitationsDialogOpen}
				onOpenChange={setIsReviewInvitationsDialogOpen}
				inviteMemberRows={inviteMemberRows}
				organizationName={organizationName}
				onInvitationsSent={() =>
					setInviteMemberRows([{ id: crypto.randomUUID(), email: "", role: "" }])
				}
			/>
		</section>
	);
}
