import { Schema, model, models } from "mongoose";

const moneyLine = new Schema({ label: { type: String, required: true, trim: true }, amount: { type: Number, required: true, min: 0 } }, { _id: false });

const PayrollSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    period: { type: String, required: true },
    basic: { type: Number, required: true, min: 0 },
    allowances: { type: [moneyLine], default: [] },
    bonuses: { type: Number, default: 0, min: 0 },
    overtime: { type: Number, default: 0, min: 0 },
    deductions: { type: Number, default: 0, min: 0 },
    advances: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    absenceDeduction: { type: Number, default: 0, min: 0 },
    gross: { type: Number, required: true, min: 0 },
    net: { type: Number, required: true, min: 0 },
    attendanceSummary: {
      present: { type: Number, default: 0 },
      late: { type: Number, default: 0 },
      halfDay: { type: Number, default: 0 },
      onLeave: { type: Number, default: 0 },
      absent: { type: Number, default: 0 },
      workingMinutes: { type: Number, default: 0 },
      overtimeMinutes: { type: Number, default: 0 },
    },
    status: { type: String, enum: ["draft", "calculated", "approved", "paid"], default: "draft", index: true },
    calculatedAt: Date,
    approvedBy: String,
    approvedAt: Date,
    paidAt: Date,
    paymentReference: String,
  },
  { timestamps: true },
);

PayrollSchema.index({ user: 1, period: 1 }, { unique: true });

const existingPayroll = models.Payroll;
if (existingPayroll) {
  if (!existingPayroll.schema.path("allowances")) existingPayroll.schema.add({ allowances: { type: [moneyLine], default: [] } });
  if (!existingPayroll.schema.path("bonuses")) existingPayroll.schema.add({ bonuses: { type: Number, default: 0 } });
  if (!existingPayroll.schema.path("advances")) existingPayroll.schema.add({ advances: { type: Number, default: 0 } });
  if (!existingPayroll.schema.path("tax")) existingPayroll.schema.add({ tax: { type: Number, default: 0 } });
  if (!existingPayroll.schema.path("absenceDeduction")) existingPayroll.schema.add({ absenceDeduction: { type: Number, default: 0 } });
  if (!existingPayroll.schema.path("gross")) existingPayroll.schema.add({ gross: Number });
  if (!existingPayroll.schema.path("attendanceSummary")) existingPayroll.schema.add({ attendanceSummary: Schema.Types.Mixed });
  if (!existingPayroll.schema.path("calculatedAt")) existingPayroll.schema.add({ calculatedAt: Date });
  if (!existingPayroll.schema.path("approvedBy")) existingPayroll.schema.add({ approvedBy: String });
  if (!existingPayroll.schema.path("approvedAt")) existingPayroll.schema.add({ approvedAt: Date });
  if (!existingPayroll.schema.path("paidAt")) existingPayroll.schema.add({ paidAt: Date });
  if (!existingPayroll.schema.path("paymentReference")) existingPayroll.schema.add({ paymentReference: String });
  const statusPath = existingPayroll.schema.path("status") as typeof PayrollSchema.paths.status;
  if ("enumValues" in statusPath && Array.isArray(statusPath.enumValues) && !statusPath.enumValues.includes("calculated")) statusPath.enumValues.push("calculated");
}

export const Payroll = existingPayroll || model("Payroll", PayrollSchema);
