import { Types } from "mongoose";
import { Invoice } from "@/models/Invoice";
import { PaymentTransaction } from "@/models/PaymentTransaction";

export async function refreshInvoiceStatus(invoiceId: string | Types.ObjectId) {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw new Error("Invoice not found");
  const totals = await PaymentTransaction.aggregate([{ $match: { invoice: new Types.ObjectId(invoiceId) } }, { $group: { _id: "$type", total: { $sum: "$amount" } } }]);
  const paid = totals.filter((row) => row._id === "payment" || row._id === "advance").reduce((sum, row) => sum + row.total, 0);
  const refunded = totals.filter((row) => row._id === "refund").reduce((sum, row) => sum + row.total, 0);
  const net = paid - refunded;
  invoice.paid = net;
  invoice.due = Math.max(0, invoice.total - net);
  invoice.status = net <= 0 ? "open" : net < invoice.total ? "partially_paid" : "paid";
  await invoice.save();
  return { invoice, paid: net, outstanding: invoice.due };
}
