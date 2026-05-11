"use server";

import { db } from "@/db";
import { ingredients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function addIngredient(formData: FormData) {
  const name = formData.get("name") as string;
  const unit = formData.get("unit") as string;
  const purchasePrice = parseFloat(formData.get("purchasePrice") as string);
  const purchaseQuantity = parseFloat(formData.get("purchaseQuantity") as string);
  
  const costPerUnit = purchasePrice / purchaseQuantity;

  await db.insert(ingredients).values({
    name,
    unit,
    purchasePrice: purchasePrice.toString(),
    purchaseQuantity: purchaseQuantity.toString(),
    costPerUnit: costPerUnit.toFixed(4),
  });

  revalidatePath("/ingredientes");
}

export async function deleteIngredient(id: number) {
  await db.delete(ingredients).where(eq(ingredients.id, id));
  revalidatePath("/ingredientes");
}

// "Simulated AI" parser
export async function parseIngredientsFromText(text: string) {
  // Simple logic to parse lines like "Leite Moça 395g R$ 7,50"
  // In a real app, this could call an LLM
  const lines = text.split('\n');
  const results = [];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    // Regex for: Item Name [Quantity] [Unit] [Price]
    // Example: "Farinha de Trigo 1000g 5.50"
    const regex = /(.+?)\s+(\d+)(g|ml|un)\s+(?:R\$|)\s*(\d+[,.]\d+)/i;
    const match = line.match(regex);
    
    if (match) {
      const [_, name, qty, unit, price] = match;
      results.push({
        name: name.trim(),
        purchaseQuantity: parseFloat(qty),
        unit: unit.toLowerCase(),
        purchasePrice: parseFloat(price.replace(',', '.'))
      });
    }
  }
  
  return results;
}
