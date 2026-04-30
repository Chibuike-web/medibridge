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

	section: {
		marginBottom: 20,
	},

	sectionHeader: {
		backgroundColor: "#f9fafb",
		borderTopLeftRadius: 10,
		borderTopRightRadius: 10,
		padding: 12,
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
		gap: 16,
	},

	gridItem: {
		width: "48%", // 2 columns approximation
		marginBottom: 12,
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
	},

	table: {
		marginTop: 8,
		borderWidth: 1,
		borderColor: "#e5e7eb",
		borderRadius: 10,
		overflow: "hidden",
	},
});

export function TransferPatientDocumentPdf({ packet }: { packet: TransferPacket }) {
	return (
		<Document>
			<Page size="A4" style={styles.page}>
				{/* Header */}
				<View style={{ marginBottom: 20 }}>
					<Text style={{ fontSize: 18, fontWeight: 700 }}>{packet.patientName}</Text>
					<Text style={{ fontSize: 10, color: "#6b7280" }}>Patient ID: {packet.patientId}</Text>
				</View>

				{/* Receiving Hospital */}
				<View style={styles.section}>
					<View style={styles.sectionHeader}>
						<Text style={styles.sectionTitle}>Receiving Hospital</Text>
					</View>
					<View style={styles.cardBody}>
						<View style={styles.grid}>
							<View style={styles.gridItem}>
								<Text style={styles.label}>Name</Text>
								<Text style={styles.value}>{packet.receivingHospitalName}</Text>
							</View>

							<View style={styles.gridItem}>
								<Text style={styles.label}>Email</Text>
								<Text style={styles.value}>{packet.receivingHospitalEmail}</Text>
							</View>
						</View>
					</View>
				</View>

				{/* Transfer Note */}
				<View style={styles.section}>
					<View style={styles.sectionHeader}>
						<Text style={styles.sectionTitle}>Transfer Note</Text>
					</View>

					<View style={styles.cardBody}>
						<Text style={{ fontSize: 10, color: "#374151" }}>{packet.transferNote}</Text>
					</View>
				</View>

				{/* Records */}
				<View style={styles.section}>
					<View style={styles.sectionHeader}>
						<Text style={styles.sectionTitle}>Clinical Records</Text>
					</View>

					<View style={styles.cardBody}>
						<View style={styles.grid}>
							{packet.records.map((record) => (
								<View key={record.id} style={styles.gridItem}>
									<Text style={styles.label}>{record.label}</Text>
									<Text style={styles.value}>{record.status}</Text>
								</View>
							))}
						</View>
					</View>
				</View>
			</Page>
		</Document>
	);
}
