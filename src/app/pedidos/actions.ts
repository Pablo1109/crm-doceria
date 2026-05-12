"use server";
import { db } from "@/db";
import { orderItems, orders, recipeIngredients } from "@/db/schema";
import { consumeStock } from "@/app/ingredientes/actions";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
export type OrderInputItem = { recipeId: number; quantity: number; unitPrice: number };
async function deductStockForOrder(orderId: number) {
  const rows = await db
    .select({
      ingredientId: recipeIngredients.ingredientId,
      recipeQty: recipeIngredients.quantity,
      orderQty: orderItems.quantity,
    })
    .from(orderItems)
    .innerJoin(recipeIngredients, eq(orderItems.recipeId, recipeIngredients.recipeId))
    .where(eq(orderItems.orderId, orderId));

  for (const r of rows) {
    const total = Number(r.recipeQty) * Number(r.orderQty);
    await consumeStock(r.ingredientId, total);
  }
}
export async function createOrder(formData: FormData, items: OrderInputItem[]) {
  const customerName = String(formData.get("customerName") || "").trim(); const customerPhone = String(formData.get("customerPhone") || "").trim(); const deliveryDate = String(formData.get("deliveryDate") || ""); const deliveryTime = String(formData.get("deliveryTime") || ""); const deliveryType = String(formData.get("deliveryType") || "retirada"); const signal = String(formData.get("signal") || "0"); const notes = String(formData.get("notes") || "");
  const totalAmount = items.reduce((a, i) => a + Number(i.quantity || 0) * Number(i.unitPrice || 0), 0);
  const fullNotes = [`Horário: ${deliveryTime || "não informado"}`, `Tipo: ${deliveryType}`, `Sinal pago: R$ ${signal}`, notes].filter(Boolean).join("\n");
  const [newOrder] = await db.insert(orders).values({ customerName, customerPhone, deliveryDate, notes: fullNotes, status: "pending", totalAmount: totalAmount.toFixed(2) }).returning();
  for (const item of items) await db.insert(orderItems).values({ orderId: newOrder.id, recipeId: Number(item.recipeId), quantity: Number(item.quantity), unitPrice: Number(item.unitPrice).toFixed(2) });
  revalidatePath("/pedidos"); revalidatePath("/"); return newOrder.id;
}
export async function updateOrderStatus(id: number, status: string) {
  const [current] = await db.select().from(orders).where(eq(orders.id, id));
  if (!current) return;

  // Baixa automática do estoque SOMENTE quando o pedido entra em Concluído/Entregue.
  // Isso evita consumir ingrediente ainda na fase de orçamento, confirmação ou produção.
  const stockAlreadyDeducted = ["finished", "delivered"].includes(current.status);
  const shouldDeductStockNow = ["finished", "delivered"].includes(status);

  await db.update(orders).set({ status }).where(eq(orders.id, id));

  if (!stockAlreadyDeducted && shouldDeductStockNow) {
    await deductStockForOrder(id);
  }

  revalidatePath("/pedidos");
  revalidatePath(`/pedidos/${id}`);
  revalidatePath("/estoque");
  revalidatePath("/financeiro");
  revalidatePath("/");
}
export async function deleteOrder(id: number) { await db.delete(orderItems).where(eq(orderItems.orderId, id)); await db.delete(orders).where(eq(orders.id, id)); revalidatePath("/pedidos"); revalidatePath("/financeiro"); revalidatePath("/"); }
