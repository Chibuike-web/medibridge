import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { personalInformation } from "./personal-information";

export const medicalInformation = pgTable("medical_information", {
	id: text("id").primaryKey(),
	patientId: text("patient_id")
		.notNull()
		.references(() => personalInformation.id, { onDelete: "cascade" }),
	height: text("height"),
	weight: text("weight"),
	bmi: text("bmi"),
	bloodPressure: text("blood_pressure"),
	lastMedicalReview: timestamp("last_medical_review"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at")
		.$onUpdate(() => /* @__PURE__ */ new Date())
		.notNull(),
});
