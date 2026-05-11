"use server";
import { db } from "@/db";
import { ingredients, orderItems, orders, recipeIngredients } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
export type OrderInputItem = { recipeId: number; quantity: number; unitPrice: number };
async function deductStockForOrder(orderId: number) {
  const rows = await db.select({ ingredientId: recipeIngredients.ingredientId, recipeQty: recipeIngredients.quantity, orderQty: orderItems.quantity }).from(orderItems).innerJoin(recipeIngredients, eq(orderItems.recipeId, recipeIngredients.recipeId)).where(eq(orderItems.orderId, orderId));
  for (const r of rows) { const total = Number(r.recipeQty) * Number(r.orderQty); await db.update(ingredients).set({ purchaseQuantity: sql`greatest(${ingredients.purchaseQuantity} - ${total}, 0)`, updatedAt: new Date() }).where(eq(ingredients.id, r.ingredientId)); }
}
export async function createOrder(formData: FormData, items: OrderInputItem[]) {
  const customerName = String(formData.get("customerName") || "").trim(); const customerPhone = String(formData.get("customerPhone") || "").trim(); const deliveryDate = String(formData.get("deliveryDate") || ""); const deliveryTime = String(formData.get("deliveryTime") || ""); const deliveryType = String(formData.get("deliveryType") || "retirada"); const signal = String(formData.get("signal") || "0"); const notes = String(formData.get("notes") || "");
  const totalAmount = items.reduce((a, i) => a + Number(i.quantity || 0) * Number(i.unitPrice || 0), 0);
  const fullNotes = [`Horário: ${deliveryTime || "não informado"}`, `Tipo: ${deliveryType}`, `Sinal pago: R$ ${signal}`, notes].filter(Boolean).join("\n");
  const [newOrder] = await db.insert(orders).values({ customerName, customerPhone, deliveryDate, notes: fullNotes, status: "pending", totalAmount: totalAmount.toFixed(2) }).returning();
  for (const item of items) await db.insert(orderItems).values({ orderId: newOrder.id, recipeId: Number(item.recipeId), quantity: Number(item.quantity), unitPrice: Number(item.unitPrice).toFixed(2) });
  revalidatePath("/pedidos"); revalidatePath("/orcamentos"); revalidatePath("/"); return newOrder.id;
}
export async function updateOrderStatus(id: number, status: string) {
  const [current] = await db.select().from(orders).where(eq(orders.id, id)); if (!current) return;
  const already = ["confirmed", "production", "finished", "delivered"].includes(current.status); const should = ["confirmed", "production", "finished", "delivered"].includes(status);
  await db.update(orders).set({ status }).where(eq(orders.id, id)); if (!already && should) await deductStockForOrder(id);
  revalidatePath("/pedidos"); revalidatePath("/estoque"); revalidatePath("/financeiro"); revalidatePath("/");
}
export async function deleteOrder(id: number) { await db.delete(orderItems).where(eq(orderItems.orderId, id)); await db.delete(orders).where(eq(orders.id, id)); revalidatePath("/pedidos"); revalidatePath("/orcamentos"); revalidatePath("/financeiro"); revalidatePath("/"); }
