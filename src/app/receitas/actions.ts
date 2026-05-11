"use server";

import { db } from "@/db";
import { recipes, recipeIngredients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createRecipe(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const laborCost = formData.get("laborCost") as string;
  const markup = formData.get("markup") as string;
  
  // Get ingredients from the form (this will be a bit complex with dynamic fields)
  // For simplicity in this first version, we'll create the recipe and redirect to an edit page
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

export async function removeIngredientFromRecipe(id: number, recipeId: number) {
  await db.delete(recipeIngredients).where(eq(recipeIngredients.id, id));
  revalidatePath(`/receitas/${recipeId}`);
}

export async function deleteRecipe(id: number) {
  await db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, id));
  await db.delete(recipes).where(eq(recipes.id, id));
  revalidatePath("/receitas");
}
