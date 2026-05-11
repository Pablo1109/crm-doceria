"use server";
import { db } from "@/db";
import { ingredients } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
function n(v: FormDataEntryValue | null) { return Number(String(v || "0").replace(",", ".")); }
export async function addIngredient(formData: FormData) {
  const name = String(formData.get("name") || "").trim(); const unit = String(formData.get("unit") || "g"); const purchasePrice = n(formData.get("purchasePrice")); const purchaseQuantity = n(formData.get("purchaseQuantity"));
  if (!name || purchaseQuantity <= 0) return;
  await db.insert(ingredients).values({ name, unit, purchasePrice: purchasePrice.toFixed(2), purchaseQuantity: purchaseQuantity.toFixed(2), costPerUnit: (purchasePrice / purchaseQuantity).toFixed(4) });
  revalidatePath("/ingredientes"); revalidatePath("/estoque"); revalidatePath("/");
}
export async function addStock(formData: FormData) {
  const ingredientId = Number(formData.get("ingredientId")); const quantity = n(formData.get("quantity")); const totalPrice = n(formData.get("totalPrice")); if (!ingredientId || quantity <= 0) return;
  const [ingredient] = await db.select().from(ingredients).where(eq(ingredients.id, ingredientId)); if (!ingredient) return;
  const currentQty = Number(ingredient.purchaseQuantity || 0); const currentCost = Number(ingredient.costPerUnit || 0); const newQty = currentQty + quantity; const addedValue = totalPrice > 0 ? totalPrice : quantity * currentCost; const newCost = newQty > 0 ? ((currentQty * currentCost) + addedValue) / newQty : currentCost;
  await db.update(ingredients).set({ purchaseQuantity: newQty.toFixed(2), purchasePrice: addedValue.toFixed(2), costPerUnit: newCost.toFixed(4), updatedAt: new Date() }).where(eq(ingredients.id, ingredientId));
  revalidatePath("/ingredientes"); revalidatePath("/estoque"); revalidatePath("/");
}
export async function adjustStock(formData: FormData) {
  const ingredientId = Number(formData.get("ingredientId")); const quantity = n(formData.get("quantity")); const type = String(formData.get("type") || "saida"); if (!ingredientId || quantity <= 0) return;
  await db.update(ingredients).set({ purchaseQuantity: type === "entrada" ? sql`${ingredients.purchaseQuantity} + ${quantity}` : sql`greatest(${ingredients.purchaseQuantity} - ${quantity}, 0)`, updatedAt: new Date() }).where(eq(ingredients.id, ingredientId));
  revalidatePath("/ingredientes"); revalidatePath("/estoque"); revalidatePath("/");
}
export async function deleteIngredient(id: number) { await db.delete(ingredients).where(eq(ingredients.id, id)); revalidatePath("/ingredientes"); revalidatePath("/estoque"); revalidatePath("/"); }
