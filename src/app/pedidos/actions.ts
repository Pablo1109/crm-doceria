"use server";
import { db } from "@/db";
import { orderItems, orders, recipeIngredients, recipes, financialTransactions } from "@/db/schema";
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
      recipeYield: recipes.yield,
    })
    .from(orderItems)
    .innerJoin(recipeIngredients, eq(orderItems.recipeId, recipeIngredients.recipeId))
    .innerJoin(recipes, eq(orderItems.recipeId, recipes.id))
    .where(eq(orderItems.orderId, orderId));

  for (const r of rows) {
    const yieldVal = Number(r.recipeYield || 1) || 1;
    const total = Number(r.recipeQty) * (Number(r.orderQty) / yieldVal);
    await consumeStock(r.ingredientId, total);
  }
}

export async function createOrder(formData: FormData, items: OrderInputItem[]) {
  const customerName = String(formData.get("customerName") || "").trim(); 
  const customerPhone = String(formData.get("customerPhone") || "").trim(); 
  const deliveryDate = String(formData.get("deliveryDate") || ""); 
  const deliveryTime = String(formData.get("deliveryTime") || ""); 
  const partyDate = String(formData.get("partyDate") || "") || null;
  const partyTime = String(formData.get("partyTime") || "") || null;
  const deliveryType = String(formData.get("deliveryType") || "retirada"); 
  const signal = String(formData.get("signal") || "0"); 
  const notes = String(formData.get("notes") || "");
  
  const totalAmount = items.reduce((a, i) => a + Number(i.quantity || 0) * Number(i.unitPrice || 0), 0);
  const fullNotes = [`Tipo: ${deliveryType}`, `Sinal pago: R$ ${signal}`, notes].filter(Boolean).join("\n");
  
  const [newOrder] = await db.insert(orders).values({ 
    customerName, 
    customerPhone, 
    deliveryDate, 
    deliveryTime: deliveryTime || null,
    partyDate: partyDate || null,
    partyTime: partyTime || null,
    notes: fullNotes, 
    status: "pending", 
    totalAmount: totalAmount.toFixed(2) 
  }).returning();
  
  for (const item of items) {
    await db.insert(orderItems).values({ 
      orderId: newOrder.id, 
      recipeId: Number(item.recipeId), 
      quantity: Number(item.quantity), 
      unitPrice: Number(item.unitPrice).toFixed(2) 
    });
  }
  
  revalidatePath("/pedidos"); 
  revalidatePath("/"); 
  return newOrder.id;
}

export async function updateOrderStatus(id: number, status: string) {
  const [current] = await db.select().from(orders).where(eq(orders.id, id));
  if (!current) return;

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

export async function settleOrder(orderId: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order || order.settled) return;

  // 1. Marcar pedido como acertado
  await db.update(orders).set({ settled: true }).where(eq(orders.id, orderId));

  // 2. Inserir transação de entrada no cofre
  await db.insert(financialTransactions).values({
    type: "income",
    amount: order.totalAmount || "0",
    description: `Pedido #${String(order.id).padStart(4, "0")} - ${order.customerName} (Acertado)`,
    date: new Date().toISOString().split("T")[0],
    category: "pedido",
    referenceId: order.id,
  });

  revalidatePath("/pedidos");
  revalidatePath(`/pedidos/${orderId}`);
  revalidatePath("/financeiro");
  revalidatePath("/");
}

export async function unsettleOrder(orderId: number) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order || !order.settled) return;

  // 1. Desmarcar como acertado
  await db.update(orders).set({ settled: false }).where(eq(orders.id, orderId));

  // 2. Apagar transação do cofre
  await db.delete(financialTransactions).where(eq(financialTransactions.referenceId, orderId));

  revalidatePath("/pedidos");
  revalidatePath(`/pedidos/${orderId}`);
  revalidatePath("/financeiro");
  revalidatePath("/");
}

export async function deleteOrder(id: number) { 
  // Excluir transações financeiras vinculadas a este pedido para não sujar o caixa
  await db.delete(financialTransactions).where(eq(financialTransactions.referenceId, id));
  await db.delete(orderItems).where(eq(orderItems.orderId, id)); 
  await db.delete(orders).where(eq(orders.id, id)); 
  revalidatePath("/pedidos"); 
  revalidatePath("/financeiro"); 
  revalidatePath("/"); 
}
