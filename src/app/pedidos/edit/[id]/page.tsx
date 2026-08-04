export const dynamic = "force-dynamic";

import { db } from "@/db";
import { recipes, recipeIngredients, ingredients, orders, orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import OrderForm from "../../novo/OrderForm";

export default async function EditPedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const orderId = Number(id);

  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order) notFound();

  const currentItems = await db
    .select({
      recipeId: orderItems.recipeId,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  const allRecipes = await db.select().from(recipes);

  const recipesWithPricing = await Promise.all(allRecipes.map(async (recipe) => {
    const items = await db.select({
      costPerUnit: ingredients.costPerUnit,
      quantity: recipeIngredients.quantity
    })
    .from(recipeIngredients)
    .innerJoin(ingredients, eq(recipeIngredients.ingredientId, ingredients.id))
    .where(eq(recipeIngredients.recipeId, recipe.id));

    const ingredientsCost = items.reduce((acc, item) => {
      return acc + (parseFloat(item.costPerUnit) * parseFloat(item.quantity));
    }, 0);

    const totalCost = ingredientsCost + parseFloat(recipe.laborCost || "0");
    const recipeTotalPrice = totalCost * (1 + parseFloat(recipe.markup || "0") / 100);
    const recipeYield = recipe.yield || 1;
    const suggestedUnitPrice = recipeYield > 0 ? recipeTotalPrice / recipeYield : recipeTotalPrice;

    return {
      id: recipe.id,
      name: recipe.name,
      yield: recipeYield,
      recipeTotalPrice,
      suggestedUnitPrice
    };
  }));

  // Parse notes to extract deliveryType and signal if formatted
  const notesLines = (order.notes || "").split("\n");
  let deliveryType = "retirada";
  let signal = "";
  const remainingNotes: string[] = [];

  for (const line of notesLines) {
    if (line.startsWith("Tipo: ")) {
      deliveryType = line.replace("Tipo: ", "").trim();
    } else if (line.startsWith("Sinal pago: R$ ")) {
      signal = line.replace("Sinal pago: R$ ", "").trim();
    } else {
      remainingNotes.push(line);
    }
  }

  const initialOrder = {
    id: order.id,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    deliveryDate: order.deliveryDate,
    deliveryTime: order.deliveryTime,
    partyDate: order.partyDate,
    partyTime: order.partyTime,
    deliveryType,
    signal,
    notes: remainingNotes.join("\n"),
    items: currentItems.map(i => ({
      recipeId: i.recipeId,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice)
    }))
  };

  return <OrderForm recipes={recipesWithPricing} initialOrder={initialOrder} />;
}
