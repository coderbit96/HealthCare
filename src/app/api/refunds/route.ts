import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/server-auth";
import { audit } from "@/lib/audit";
import { refreshInvoiceStatus } from "@/lib/billing";
import { Invoice } from "@/models/Invoice";
import { PaymentTransaction } from "@/models/PaymentTransaction";
import { Refund } from "@/models/Refund";

const requestSchema = z.object({ invoice: z.string().length(24), payment: z.string().length(24).optional(), amount: z.number().positive(), reason: z.string().trim().min(3).max(1_000) });
const decisionSchema = z.object({ id: z.string().length(24), status: z.enum(["approved", "rejected", "processed"]), method: z.enum(["cash", "card", "upi", "online", "insurance"]).optional(), reference: z.string().trim().max(120).optional(), note: z.string().trim().max(500).optional() });

export async function GET(request: NextRequest) {
  try {
    await requirePermission(request, "billing:read");
    const invoice = request.nextUrl.searchParams.get("invoice");
    return NextResponse.json(await Refund.find(invoice ? { invoice } : {}).populate("invoice", "invoiceNumber total paid due status").populate("payment", "amount method reference").sort({ createdAt: -1 }).limit(100).lean());
  } catch (error) { const message = error instanceof Error ? error.message : "Unable to load refunds"; return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 401 }); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requirePermission(request, "payments:write");
    const input = requestSchema.parse(await request.json());
    const invoice = await Invoice.findById(input.invoice);
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    if (input.payment && !await PaymentTransaction.exists({ _id: input.payment, invoice: input.invoice })) return NextResponse.json({ error: "Payment does not belong to this invoice" }, { status: 400 });
    const reserved = await Refund.aggregate([{ $match: { invoice: invoice._id, status: { $in: ["requested", "approved", "processed"] } } }, { $group: { _id: null, amount: { $sum: "$amount" } } }]);
    if (input.amount + (reserved[0]?.amount ?? 0) > invoice.paid) return NextResponse.json({ error: "Requested refunds exceed the paid invoice amount" }, { status: 400 });
    const refund = await Refund.create({ ...input, requestedBy: user.firebaseUid });
    await audit(user.firebaseUid, "refund.requested", "Refund", refund._id.toString(), { invoice: input.invoice, amount: input.amount });
    return NextResponse.json(refund, { status: 201 });
  } catch (error) { const message = error instanceof z.ZodError ? "Invalid refund request" : error instanceof Error ? error.message : "Unable to request refund"; return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 }); }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requirePermission(request, "settings:write");
    const input = decisionSchema.parse(await request.json());
    const refund = await Refund.findById(input.id);
    if (!refund) return NextResponse.json({ error: "Refund request not found" }, { status: 404 });
    if (input.status === "processed") {
      if (refund.status !== "approved") return NextResponse.json({ error: "Only approved refunds can be processed" }, { status: 409 });
      if (!input.method) return NextResponse.json({ error: "A refund method is required" }, { status: 400 });
      const invoice = await Invoice.findById(refund.invoice);
      if (!invoice || refund.amount > invoice.paid) return NextResponse.json({ error: "Refund exceeds the current paid invoice amount" }, { status: 409 });
      const reference = `refund:${refund._id}`;
      if (await PaymentTransaction.exists({ reference, type: "refund" })) return NextResponse.json({ error: "Refund was already processed" }, { status: 409 });
      await PaymentTransaction.create({ invoice: refund.invoice, patient: invoice.patient, type: "refund", method: input.method, amount: refund.amount, reference, receivedBy: user.firebaseUid, note: input.note });
      refund.status = "processed";
      refund.approvedBy = user.firebaseUid;
      await refund.save();
      const balance = await refreshInvoiceStatus(invoice._id);
      await audit(user.firebaseUid, "refund.processed", "Refund", refund._id.toString(), { amount: refund.amount, method: input.method });
      return NextResponse.json({ refund, balance: { paid: balance.paid, outstanding: balance.outstanding, status: balance.invoice.status } });
    }
    if (refund.status !== "requested") return NextResponse.json({ error: "Only requested refunds can be approved or rejected" }, { status: 409 });
    refund.status = input.status;
    refund.approvedBy = user.firebaseUid;
    await refund.save();
    await audit(user.firebaseUid, `refund.${input.status}`, "Refund", refund._id.toString());
    return NextResponse.json(refund);
  } catch (error) { const message = error instanceof z.ZodError ? "Invalid refund decision" : error instanceof Error ? error.message : "Unable to update refund"; return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 }); }
}
