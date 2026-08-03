"use server";
import { db } from "@/db";
import { ingredients, stockBatches, financialTransactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function n(v: FormDataEntryValue | null) {
  return Number(String(v || "0").replace(",", "."));
}
function refresh() {
  revalidatePath("/ingredientes");
  revalidatePath("/estoque");
  revalidatePath("/");
}

export async function addIngredient(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const unit = String(formData.get("unit") || "g");
  const packageLabel = String(formData.get("packageLabel") || "unidade").trim();
  const purchaseQuantity = n(formData.get("purchaseQuantity"));
  const purchasePrice = n(formData.get("purchasePrice"));
  const minimumStock = n(formData.get("minimumStock"));
  if (!name || purchaseQuantity <= 0) return;
  const costPerUnit = purchasePrice > 0 ? purchasePrice / purchaseQuantity : 0;
  const minimumPackageCount = n(formData.get("minimumPackageCount"));
  await db.insert(ingredients).values({
    name,
    unit,
    packageLabel,
    purchasePrice: purchasePrice.toFixed(2),
    purchaseQuantity: purchaseQuantity.toFixed(2),
    costPerUnit: costPerUnit.toFixed(4),
    minimumStock: minimumStock.toFixed(2),
    minimumPackageCount: minimumPackageCount.toFixed(2),
  });
  refresh();
  redirect("/ingredientes?success=ingrediente");
}

export async function addStock(formData: FormData) {
  const ingredientId = Number(formData.get("ingredientId"));
  const packageCount = n(formData.get("packageCount"));
  const quantityPerPackage = n(formData.get("quantityPerPackage"));
  const totalPrice = n(formData.get("totalPrice"));
  const packageLabel = String(formData.get("packageLabel") || "").trim();
  const supplier = String(formData.get("supplier") || "").trim();
  const expiresAt = String(formData.get("expiresAt") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  if (!ingredientId || packageCount <= 0 || quantityPerPackage <= 0) return;
  
  const [ingredient] = await db.select().from(ingredients).where(eq(ingredients.id, ingredientId));
  if (!ingredient) return;
  
  const totalQuantity = packageCount * quantityPerPackage;
  const costPerUnit = totalPrice > 0 ? totalPrice / totalQuantity : Number(ingredient.costPerUnit || 0);
  
  const [newBatch] = await db.insert(stockBatches).values({
    ingredientId,
    packageLabel: packageLabel || ingredient.packageLabel || "unidade",
    packageCount: packageCount.toFixed(2),
    quantityPerPackage: quantityPerPackage.toFixed(2),
    unit: ingredient.unit,
    totalQuantity: totalQuantity.toFixed(2),
    totalPrice: totalPrice.toFixed(2),
    costPerUnit: costPerUnit.toFixed(4),
    supplier: supplier || null,
    expiresAt: expiresAt || null,
    notes: notes || null,
  }).returning();

  if (totalPrice > 0 && newBatch) {
    // Registrar a despesa de compra de estoque no cofre
    await db.insert(financialTransactions).values({
      type: "expense",
      amount: totalPrice.toFixed(2),
      description: `Compra estoque: ${packageCount} ${newBatch.packageLabel}(s) de ${ingredient.name}`,
      date: new Date().toISOString().split("T")[0],
      category: "ingrediente",
      referenceId: newBatch.id, // link para o lote de estoque
    });

    // Atualiza preço médio de compra no ingrediente
    await db.update(ingredients).set({
      purchasePrice: (totalPrice / packageCount).toFixed(2),
      purchaseQuantity: quantityPerPackage.toFixed(2),
      costPerUnit: costPerUnit.toFixed(4),
      updatedAt: new Date(),
    }).where(eq(ingredients.id, ingredientId));
  }
  
  refresh();
  redirect("/estoque?success=estoque");
}

export async function adjustStock(formData: FormData) {
  const ingredientId = Number(formData.get("ingredientId"));
  const type = String(formData.get("type") || "saida");
  const packageCount = n(formData.get("packageCount"));
  const quantityPerPackage = n(formData.get("quantityPerPackage"));
  const notes = String(formData.get("notes") || "Ajuste manual").trim();
  if (!ingredientId || packageCount <= 0 || quantityPerPackage <= 0) return;
  const [ingredient] = await db.select().from(ingredients).where(eq(ingredients.id, ingredientId));
  if (!ingredient) return;
  const totalQuantity = packageCount * quantityPerPackage;
  if (type === "entrada") {
    await db.insert(stockBatches).values({
      ingredientId,
      packageLabel: ingredient.packageLabel || "unidade",
      packageCount: packageCount.toFixed(2),
      quantityPerPackage: quantityPerPackage.toFixed(2),
      unit: ingredient.unit,
      totalQuantity: totalQuantity.toFixed(2),
      totalPrice: "0.00",
      costPerUnit: String(ingredient.costPerUnit || "0"),
      notes,
    });
  } else {
    await consumeStock(ingredientId, totalQuantity);
  }
  refresh();
  redirect("/estoque?success=ajuste");
}

export async function consumeStock(ingredientId: number, quantity: number) {
  let remaining = quantity;
  const batches = await db.select().from(stockBatches).where(eq(stockBatches.ingredientId, ingredientId)).orderBy(stockBatches.createdAt);
  for (const batch of batches) {
    if (remaining <= 0) break;
    const available = Number(batch.totalQuantity || 0);
    if (available <= 0) continue;
    const used = Math.min(available, remaining);
    const newTotal = available - used;
    const qpp = Number(batch.quantityPerPackage || 1) || 1;
    const newPackageCount = newTotal / qpp;
    await db.update(stockBatches).set({
      totalQuantity: newTotal.toFixed(2),
      packageCount: newPackageCount.toFixed(2),
    }).where(eq(stockBatches.id, batch.id));
    remaining -= used;
  }
}

export async function deleteStockBatch(id: number) {
  // Excluir movimentações financeiras atreladas a este lote
  await db.delete(financialTransactions).where(eq(financialTransactions.referenceId, id));
  await db.delete(stockBatches).where(eq(stockBatches.id, id));
  refresh();
  redirect("/estoque?success=excluido");
}
export async function editIngredient(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const unit = String(formData.get("unit") || "g");
  const packageLabel = String(formData.get("packageLabel") || "unidade").trim();
  const purchaseQuantity = Number(String(formData.get("purchaseQuantity") || "0").replace(",", "."));
  const purchasePrice = Number(String(formData.get("purchasePrice") || "0").replace(",", "."));
  const minimumStock = Number(String(formData.get("minimumStock") || "0").replace(",", "."));
  const minimumPackageCount = Number(String(formData.get("minimumPackageCount") || "0").replace(",", "."));

  if (!id || !name) return;

  const costPerUnit = purchasePrice > 0 ? purchasePrice / purchaseQuantity : 0;

  await db.update(ingredients)
    .set({
      name,
      unit,
      packageLabel,
      purchasePrice: purchasePrice.toFixed(2),
      purchaseQuantity: purchaseQuantity.toFixed(2),
      costPerUnit: costPerUnit.toFixed(4),
      minimumStock: minimumStock.toFixed(2),
      minimumPackageCount: minimumPackageCount.toFixed(2),
    })
    .where(eq(ingredients.id, id));

  // revalidate dependent pages
  revalidatePath("/ingredientes");
  revalidatePath("/estoque");
  revalidatePath("/");

  redirect("/ingredientes?success=editado");
}


export async function deleteIngredient(id: number) {
  await db.delete(stockBatches).where(eq(stockBatches.ingredientId, id));
  await db.delete(ingredients).where(eq(ingredients.id, id));
  refresh();
  redirect("/ingredientes?success=excluido");
}
