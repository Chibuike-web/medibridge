import {
	Document,
	Page,
StyleSheet,
	Text,
	View,
} from "@react-pdf/renderer";
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
		marginBottom: 20,
		paddingBottom: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#e5e7eb",
	},
	eyebrow: {
		fontSize: 10,
		color: "#6b7280",
		textTransform: "uppercase",
		marginBottom: 8,
	},
	title: {
		fontSize: 22,
		fontWeight: 700,
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 11,
		color: "#4b5563",
	},
	sectionRow: {
		flexDirection: "row",
		gap: 16,
		marginBottom: 20,
	},
	card: {
		flex: 1,
		backgroundColor: "#f9fafb",
		borderWidth: 1,
		borderColor: "#e5e7eb",
		borderRadius: 12,
		padding: 14,
	},
	cardTitle: {
		fontSize: 11,
		fontWeight: 700,
		marginBottom: 8,
	},
	cardLine: {
		fontSize: 10,
		color: "#374151",
		marginBottom: 6,
	},
	sectionTitle: {
		fontSize: 12,
		fontWeight: 700,
		marginBottom: 10,
	},
	table: {
		borderWidth: 1,
		borderColor: "#e5e7eb",
		borderRadius: 12,
		overflow: "hidden",
	},
	tableHeader: {
		flexDirection: "row",
		backgroundColor: "#f9fafb",
		borderBottomWidth: 1,
		borderBottomColor: "#e5e7eb",
	},
	tableHeaderCell: {
		flex: 1,
		paddingVertical: 10,
		paddingHorizontal: 12,
		fontSize: 10,
		fontWeight: 700,
		color: "#4b5563",
	},
	tableRow: {
		flexDirection: "row",
		borderBottomWidth: 1,
		borderBottomColor: "#e5e7eb",
	},
	tableCell: {
		flex: 1,
		paddingVertical: 10,
		paddingHorizontal: 12,
		fontSize: 10,
		color: "#111827",
	},
});

export function TransferPatientDocumentPdf({ packet }: { packet: TransferPacket }) {
	return (
		<Document>
			<Page size="A4" style={styles.page}>
				<View style={styles.header}>
					<Text style={styles.eyebrow}>Patient Transfer Document</Text>
					<Text style={styles.title}>{packet.patientName}</Text>
					<Text style={styles.subtitle}>Patient ID: {packet.patientId}</Text>
				</View>

				<View style={styles.sectionRow}>
					<View style={styles.card}>
						<Text style={styles.cardTitle}>Receiving hospital</Text>
						<Text style={styles.cardLine}>Name: {packet.receivingHospitalName}</Text>
						<Text style={styles.cardLine}>Email: {packet.receivingHospitalEmail}</Text>
					</View>

					<View style={styles.card}>
						<Text style={styles.cardTitle}>Transfer note</Text>
						<Text style={styles.cardLine}>{packet.transferNote}</Text>
					</View>
				</View>

				<View>
					<Text style={styles.sectionTitle}>Selected clinical records</Text>

					<View style={styles.table}>
						<View style={styles.tableHeader}>
							<Text style={styles.tableHeaderCell}>Record</Text>
							<Text style={styles.tableHeaderCell}>Status</Text>
						</View>

						{packet.records.map((record) => (
							<View key={record.id} style={styles.tableRow}>
								<Text style={styles.tableCell}>{record.label}</Text>
								<Text style={styles.tableCell}>{record.status}</Text>
							</View>
						))}
					</View>
				</View>
			</Page>
		</Document>
	);
}
