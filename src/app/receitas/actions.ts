"use server";

import { db } from "@/db";
import { recipes, recipeIngredients, ingredients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function n(v: FormDataEntryValue | null) {
  return Number(String(v || "0").replace(",", "."));
}

export async function createRecipe(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const laborCost = formData.get("laborCost") as string;
  const markup = formData.get("markup") as string;

  const [newRecipe] = await db.insert(recipes).values({
    name,
    description,
    laborCost,
    markup,
  }).returning();

  revalidatePath("/receitas");
  return newRecipe.id;
}

export async function addIngredientToRecipe(recipeId: number, ingredientId: number, quantity: number) {
  await db.insert(recipeIngredients).values({
    recipeId,
    ingredientId,
    quantity: quantity.toString(),
  });
  revalidatePath(`/receitas/${recipeId}`);
}

export async function addIngredientToRecipeFromForm(recipeId: number, formData: FormData) {
  const ingredientId = Number(formData.get("ingredientId"));
  const usageMode = String(formData.get("usageMode") || "manual");
  let quantity = n(formData.get("quantity"));

  if (!ingredientId) return;

  if (usageMode === "package") {
    const packageCount = n(formData.get("packageCount"));
    const [ingredient] = await db.select().from(ingredients).where(eq(ingredients.id, ingredientId));
    quantity = packageCount * Number(ingredient?.purchaseQuantity || 0);
  }

  if (quantity <= 0) return;

  await addIngredientToRecipe(recipeId, ingredientId, quantity);
  redirect(`/receitas/${recipeId}?success=receita`);
}

export async function removeIngredientFromRecipe(id: number, recipeId: number) {
  await db.delete(recipeIngredients).where(eq(recipeIngredients.id, id));
  revalidatePath(`/receitas/${recipeId}`);
  redirect(`/receitas/${recipeId}?success=excluido`);
}

export async function deleteRecipe(id: number) {
  await db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, id));
  await db.delete(recipes).where(eq(recipes.id, id));
  revalidatePath("/receitas");
}
