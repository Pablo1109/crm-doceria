"use server";

import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createOrder(formData: FormData, items: { recipeId: number, quantity: number, unitPrice: number }[]) {
  const customerName = formData.get("customerName") as string;
  const customerPhone = formData.get("customerPhone") as string;
  const deliveryDate = formData.get("deliveryDate") as string;
  const notes = formData.get("notes") as string;
  
  const totalAmount = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

  const [newOrder] = await db.insert(orders).values({
    customerName,
    customerPhone,
    deliveryDate,
    notes,
    status: "pending",
    totalAmount: totalAmount.toFixed(2),
  }).returning();

  for (const item of items) {
    await db.insert(orderItems).values({
      orderId: newOrder.id,
      recipeId: item.recipeId,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toString(),
    });
  }

  revalidatePath("/pedidos");
  revalidatePath("/");
  return newOrder.id;
}

export async function updateOrderStatus(id: number, status: string) {
  await db.update(orders).set({ status }).where(eq(orders.id, id));
  revalidatePath("/pedidos");
  revalidatePath("/");
}

export async function deleteOrder(id: number) {
  await db.delete(orderItems).where(eq(orderItems.orderId, id));
  await db.delete(orders).where(eq(orders.id, id));
  revalidatePath("/pedidos");
  revalidatePath("/");
}
