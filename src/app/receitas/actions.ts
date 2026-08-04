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
  const yieldValue = Number(formData.get("yield") || "35");
  const laborCost = formData.get("laborCost") as string;
  const markup = formData.get("markup") as string;
  const ingredientsJson = formData.get("ingredientsJson") as string;

  const [newRecipe] = await db.insert(recipes).values({
    name,
    description,
    yield: yieldValue,
    laborCost,
    markup,
  }).returning();

  if (ingredientsJson) {
    try {
      const list = JSON.parse(ingredientsJson) as {
        ingredientId: number;
        usageMode: string;
        quantity: number;
        packageCount: number;
      }[];

      for (const item of list) {
        let quantity = Number(item.quantity || 0);

        if (item.usageMode === "package") {
          const [ingredient] = await db.select().from(ingredients).where(eq(ingredients.id, item.ingredientId));
          quantity = Number(item.packageCount || 0) * Number(ingredient?.purchaseQuantity || 0);
        }

        if (quantity > 0 && item.ingredientId) {
          await db.insert(recipeIngredients).values({
            recipeId: newRecipe.id,
            ingredientId: item.ingredientId,
            quantity: quantity.toString(),
          });
        }
      }
    } catch (err) {
      console.error("Erro ao associar ingredientes no cadastro da receita:", err);
    }
  }

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
  redirect("/receitas?success=excluido");
}

export async function updateRecipe(id: number, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const yieldValue = Number(formData.get("yield") || "35");
  const laborCost = String(formData.get("laborCost") || "0").replace(",", ".");
  const markup = String(formData.get("markup") || "100").replace(",", ".");

  if (!id || !name) return;

  await db.update(recipes).set({
    name,
    description,
    yield: yieldValue,
    laborCost,
    markup,
  }).where(eq(recipes.id, id));

  revalidatePath("/receitas");
  revalidatePath(`/receitas/${id}`);
  revalidatePath("/pedidos");
  revalidatePath("/");
  redirect(`/receitas/${id}?success=editado`);
}
