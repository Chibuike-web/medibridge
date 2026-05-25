"use client";

import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { TransferPacket } from "./types";

const styles = StyleSheet.create({
	page: {
		backgroundColor: "#ffffff",
		padding: 32,
		fontSize: 11,
		color: "#111827",
		fontFamily: "Helvetica",
	},

	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "flex-end",
		marginBottom: 28,
	},

	headerContent: {
		flexDirection: "column",
		gap: 6,
	},

	patientName: {
		fontSize: 24,
		fontWeight: 700,
		color: "#1f2937",
	},

	headerMeta: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 14,
		marginTop: 4,
	},

	headerMetaText: {
		fontSize: 10,
		color: "#6b7280",
	},

	sectionGroup: {
		flexDirection: "column",
		gap: 20,
	},

	pageHeading: {
		fontSize: 20,
		fontWeight: 700,
		color: "#1f2937",
		marginBottom: 16,
	},

	section: {
		flexDirection: "column",
		gap: 10,
	},

	sectionTitle: {
		fontSize: 16,
		fontWeight: 700,
		color: "#4b5563",
	},

	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		columnGap: 16,
		rowGap: 16,
	},

	gridItem: {
		width: "31%",
		flexDirection: "column",
		gap: 4,
	},

	label: {
		fontSize: 10,
		color: "#9ca3af",
	},

	value: {
		fontSize: 11,
		fontWeight: 700,
		color: "#4b5563",
		lineHeight: 1.5,
	},

	fullWidth: {
		width: "100%",
	},

	paragraph: {
		fontSize: 11,
		color: "#374151",
		lineHeight: 1.7,
	},
});

function Field({
	label,
	value,
	fullWidth = false,
}: {
	label: string;
	value: string | number | undefined;
	fullWidth?: boolean;
}) {
	return (
		<View style={[styles.gridItem, fullWidth ? styles.fullWidth : {}]}>
			<Text style={styles.label}>{label}</Text>

			<Text style={styles.value}>{value || "—"}</Text>
		</View>
	);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<View style={styles.section}>
			<Text style={styles.sectionTitle}>{title}</Text>

			<View style={styles.grid}>{children}</View>
		</View>
	);
}

export function TransferPatientDocumentPdf({ packet }: { packet: TransferPacket }) {
	return (
		<Document>
			<Page size="A4" style={styles.page}>
				{/* Header */}
				<View style={styles.header}>
					<View style={styles.headerContent}>
						<Text style={styles.patientName}>{packet.patientName}</Text>

						<View style={styles.headerMeta}>
							<Text style={styles.headerMetaText}>Patient ID: {packet.patientId}</Text>

							<Text style={styles.headerMetaText}>
								Date of Birth: {packet.personalInformation.dateOfBirth}
							</Text>

							<Text style={styles.headerMetaText}>
								Email: {packet.contactInformation.emailAddress}
							</Text>

							<Text style={styles.headerMetaText}>
								Phone: {packet.contactInformation.phoneNumber}
							</Text>
						</View>
					</View>
				</View>

				{/* Receiving Hospital */}
				<Section title="Receiving Hospital">
					<Field label="Hospital Name" value={packet.receivingHospitalName} />

					<Field label="Hospital Email" value={packet.receivingHospitalEmail} />

					<Field label="Transfer Note" value={packet.transferNote} fullWidth />
				</Section>

				{/* Patient Details */}
				<View style={styles.sectionGroup}>
					<Text style={styles.pageHeading}>Patient Details</Text>

					<Section title="Personal Information">
						<Field label="First Name" value={packet.personalInformation.firstName} />

						<Field label="Middle Name" value={packet.personalInformation.middleName} />

						<Field label="Last Name" value={packet.personalInformation.lastName} />

						<Field label="Patient ID" value={packet.personalInformation.patientId} />

						<Field label="Age" value={packet.personalInformation.age} />

						<Field label="Date of Birth" value={packet.personalInformation.dateOfBirth} />

						<Field label="Sex" value={packet.personalInformation.sex} />

						<Field label="Marital Status" value={packet.personalInformation.maritalStatus} />

						<Field label="National ID" value={packet.personalInformation.nationalId} />
					</Section>

					<Section title="Contact Information">
						<Field label="Phone Number" value={packet.contactInformation.phoneNumber} />

						<Field label="Email Address" value={packet.contactInformation.emailAddress} />

						<Field
							label="Residential Address"
							value={packet.contactInformation.residentialAddress}
						/>

						<Field label="State of Origin" value={packet.contactInformation.stateOfOrigin} />

						<Field label="Country of Origin" value={packet.contactInformation.countryOfOrigin} />
					</Section>

					<Section title="Emergency Contact">
						<Field label="First Name" value={packet.emergencyContact.firstName} />

						<Field label="Middle Name" value={packet.emergencyContact.middleName} />

						<Field label="Last Name" value={packet.emergencyContact.lastName} />

						<Field label="Relationship" value={packet.emergencyContact.relationship} />

						<Field label="Phone Number" value={packet.emergencyContact.phoneNumber} />
					</Section>

					<Section title="Physical Information">
						<Field label="Height" value={packet.physicalInformation.height} />

						<Field label="Weight" value={packet.physicalInformation.weight} />

						<Field label="Blood Group" value={packet.physicalInformation.bloodGroup} />

						<Field label="Genotype" value={packet.physicalInformation.genotype} />
					</Section>
				</View>
			</Page>
		</Document>
	);
}
