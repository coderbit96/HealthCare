import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/server-auth";
import { InventoryItem } from "@/models/InventoryItem";
export async function GET(request: NextRequest) { try { await requirePermission(request, "inventory:read"); const lowStock = request.nextUrl.searchParams.get("lowStock") === "true"; const items = await InventoryItem.find().sort({ name: 1 }).lean(); return NextResponse.json(lowStock ? items.filter(item => item.quantity <= item.reorderLevel) : items); } catch (error) { const message = error instanceof Error ? error.message : "Unable to load inventory"; return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 401 }); } }
