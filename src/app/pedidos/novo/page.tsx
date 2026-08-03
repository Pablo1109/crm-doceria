export const dynamic = "force-dynamic";

import { db } from "@/db";
import { recipes, recipeIngredients, ingredients } from "@/db/schema";
import { eq } from "drizzle-orm";
import OrderForm from "./OrderForm";

export default async function NovoPedidoPage() {
  const allRecipes = await db.select().from(recipes);
  
  // Need to calculate suggested price for each recipe
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
    const suggestedPrice = totalCost * (1 + parseFloat(recipe.markup || "0") / 100);

    return {
      id: recipe.id,
      name: recipe.name,
      suggestedPrice
    };
  }));

  return <OrderForm recipes={recipesWithPricing} />;
}
