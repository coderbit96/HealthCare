import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/server-auth";
import { Payroll } from "@/models/Payroll";

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[character] ?? character);
}

function money(value: unknown) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value ?? 0));
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission(request, "payroll:write");
    const { id } = await params;
    const payroll = await Payroll.findById(id).populate("user", "name email department").lean();
    if (!payroll) return NextResponse.json({ error: "Payroll record not found" }, { status: 404 });
    const employee = payroll.user as unknown as { name?: string; email?: string; department?: string };
    const lines = (payroll.allowances ?? []).map((line: { label: string; amount: number }) => `<tr><td>${escapeHtml(line.label)}</td><td>${money(line.amount)}</td></tr>`).join("");
    const body = `<!doctype html><html><head><meta charset="utf-8"><title>Payslip ${escapeHtml(payroll.period)}</title><style>body{font-family:Arial,sans-serif;color:#18211f;margin:40px;max-width:760px}.head{display:flex;justify-content:space-between;border-bottom:2px solid #0f766e;padding-bottom:20px}.tag{color:#0f766e;text-transform:uppercase;letter-spacing:.12em;font-size:12px;font-weight:700}h1{margin:5px 0;font-size:28px}table{width:100%;border-collapse:collapse;margin-top:26px}td{padding:10px;border-bottom:1px solid #e7e0d7}td:last-child{text-align:right}.total{font-weight:700;font-size:18px;background:#e5f4f1}.muted{color:#66736f;font-size:13px}@media print{body{margin:20px}.print{display:none}}</style></head><body><button class="print" onclick="window.print()">Print / Save as PDF</button><div class="head"><div><div class="tag">Health Care Pvt. Ltd.</div><h1>Salary payslip</h1><p class="muted">Payroll period: ${escapeHtml(payroll.period)}</p></div><div><strong>${escapeHtml(employee.name)}</strong><br><span class="muted">${escapeHtml(employee.department || "Hospital staff")}</span><br><span class="muted">${escapeHtml(employee.email)}</span></div></div><table><tbody><tr><td>Basic salary</td><td>${money(payroll.basic)}</td></tr>${lines}<tr><td>Bonus</td><td>${money(payroll.bonuses)}</td></tr><tr><td>Overtime</td><td>${money(payroll.overtime)}</td></tr><tr><td><strong>Gross salary</strong></td><td><strong>${money(payroll.gross)}</strong></td></tr><tr><td>Deductions</td><td>−${money(payroll.deductions)}</td></tr><tr><td>Advances</td><td>−${money(payroll.advances)}</td></tr><tr><td>Tax</td><td>−${money(payroll.tax)}</td></tr><tr><td>Attendance deduction</td><td>−${money(payroll.absenceDeduction)}</td></tr><tr class="total"><td>Net salary</td><td>${money(payroll.net)}</td></tr></tbody></table><p class="muted">Status: ${escapeHtml(payroll.status)} · Attendance: ${payroll.attendanceSummary?.present ?? 0} present, ${payroll.attendanceSummary?.onLeave ?? 0} leave, ${payroll.attendanceSummary?.absent ?? 0} absent.</p></body></html>`;
    return new NextResponse(body, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create payslip";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 401 });
  }
}
