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
		marginBottom: 24,
	},

	patientName: {
		fontSize: 20,
		fontWeight: 700,
		marginBottom: 8,
		color: "#111827",
	},

	headerMeta: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 12,
	},

	headerMetaText: {
		fontSize: 10,
		color: "#6b7280",
	},

	section: {
		marginBottom: 20,
	},

	sectionHeader: {
		backgroundColor: "#f9fafb",
		borderTopLeftRadius: 10,
		borderTopRightRadius: 10,
		paddingVertical: 10,
		paddingHorizontal: 12,
		borderWidth: 1,
		borderColor: "#e5e7eb",
		borderBottomWidth: 0,
	},

	sectionTitle: {
		fontSize: 12,
		fontWeight: 700,
		color: "#4b5563",
	},

	cardBody: {
		borderWidth: 1,
		borderColor: "#e5e7eb",
		borderBottomLeftRadius: 10,
		borderBottomRightRadius: 10,
		backgroundColor: "#ffffff",
		padding: 12,
	},

	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		marginHorizontal: -8,
	},

	gridItem: {
		width: "50%",
		paddingHorizontal: 8,
		marginBottom: 14,
	},

	label: {
		fontSize: 10,
		color: "#9ca3af",
		marginBottom: 4,
	},

	value: {
		fontSize: 11,
		fontWeight: 700,
		color: "#4b5563",
		lineHeight: 1.5,
	},

	paragraph: {
		fontSize: 10,
		color: "#374151",
		lineHeight: 1.6,
	},
});

function Field({ label, value }: { label: string; value: string | number | undefined }) {
	return (
		<View style={styles.gridItem}>
			<Text style={styles.label}>{label}</Text>
			<Text style={styles.value}>{value || "—"}</Text>
		</View>
	);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<View style={styles.section}>
			<View style={styles.sectionHeader}>
				<Text style={styles.sectionTitle}>{title}</Text>
			</View>

			<View style={styles.cardBody}>
				<View style={styles.grid}>{children}</View>
			</View>
		</View>
	);
}

export function TransferPatientDocumentPdf({ packet }: { packet: TransferPacket }) {
	return (
		<Document>
			<Page size="A4" style={styles.page}>
				{/* Header */}
				<View style={styles.header}>
					<Text style={styles.patientName}>{packet.patientName}</Text>

					<View style={styles.headerMeta}>
						<Text style={styles.headerMetaText}>Patient ID: {packet.patientId}</Text>

						<Text style={styles.headerMetaText}>
							Email: {packet.contactInformation.emailAddress}
						</Text>

						<Text style={styles.headerMetaText}>
							Phone: {packet.contactInformation.phoneNumber}
						</Text>
					</View>
				</View>

				{/* Receiving Hospital */}
				<Section title="Receiving Hospital">
					<Field label="Hospital Name" value={packet.receivingHospitalName} />

					<Field label="Hospital Email" value={packet.receivingHospitalEmail} />
				</Section>

				{/* Transfer Note */}
				<View style={styles.section}>
					<View style={styles.sectionHeader}>
						<Text style={styles.sectionTitle}>Transfer Note</Text>
					</View>

					<View style={styles.cardBody}>
						<Text style={styles.paragraph}>{packet.transferNote}</Text>
					</View>
				</View>

				{/* Personal Information */}
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

				{/* Contact Information */}
				<Section title="Contact Information">
					<Field label="Phone Number" value={packet.contactInformation.phoneNumber} />

					<Field label="Email Address" value={packet.contactInformation.emailAddress} />

					<Field label="Residential Address" value={packet.contactInformation.residentialAddress} />

					<Field label="State of Origin" value={packet.contactInformation.stateOfOrigin} />

					<Field label="Country of Origin" value={packet.contactInformation.countryOfOrigin} />
				</Section>

				{/* Emergency Contact */}
				<Section title="Emergency Contact">
					<Field label="First Name" value={packet.emergencyContact.firstName} />

					<Field label="Middle Name" value={packet.emergencyContact.middleName} />

					<Field label="Last Name" value={packet.emergencyContact.lastName} />

					<Field label="Relationship" value={packet.emergencyContact.relationship} />

					<Field label="Phone Number" value={packet.emergencyContact.phoneNumber} />
				</Section>

				{/* Physical Information */}
				<Section title="Physical Information">
					<Field label="Height" value={packet.physicalInformation.height} />

					<Field label="Weight" value={packet.physicalInformation.weight} />

					<Field label="Blood Group" value={packet.physicalInformation.bloodGroup} />

					<Field label="Genotype" value={packet.physicalInformation.genotype} />
				</Section>

				{/* Clinical Records */}
				<Section title="Clinical Records">
					{packet.records.map((record) => (
						<Field key={record.id} label={record.label} value={record.status} />
					))}
				</Section>
			</Page>
		</Document>
	);
}
