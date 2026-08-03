import { z } from "zod";
import { db } from "@/db";
import { ingredients, stockBatches, financialTransactions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const createPurchaseSchema = z.object({
  supplier: z.string().optional(),
  date: z.string().min(1, "Data da compra é obrigatória"), // YYYY-MM-DD
  items: z.array(z.object({
    ingredientId: z.number(),
    packageCount: z.number(),
    purchasePrice: z.number() // Preço total pago por esse ingrediente
  })),
  notes: z.string().optional()
});

export const createPurchaseAction = {
  name: "create_purchase",
  description: "Registra uma compra de insumos no estoque e desconta automaticamente o valor do cofre físico (lança despesa).",
  inputSchema: createPurchaseSchema,
  execute: async (input: z.infer<typeof createPurchaseSchema>) => {
    let totalPurchaseCost = 0;
    const addedBatches = [];

    for (const item of input.items) {
      // 1. Buscar detalhes do ingrediente no banco para obter a embalagem padrão
      const [ing] = await db.select().from(ingredients).where(eq(ingredients.id, item.ingredientId));
      if (!ing) continue;

      const qtyPerPackage = Number(ing.purchaseQuantity || 0);
      const totalQty = qtyPerPackage * item.packageCount;
      const costPerUnit = totalQty > 0 ? (item.purchasePrice / totalQty) : 0;

      // 2. Inserir lote no estoque
      const [batch] = await db.insert(stockBatches).values({
        ingredientId: item.ingredientId,
        packageLabel: ing.packageLabel || "unidade",
        packageCount: item.packageCount.toString(),
        quantityPerPackage: qtyPerPackage.toString(),
        unit: ing.unit,
        totalQuantity: totalQty.toString(),
        totalPrice: item.purchasePrice.toString(),
        costPerUnit: costPerUnit.toFixed(4),
        supplier: input.supplier || null,
        notes: input.notes || null,
        date: input.date
      } as any).returning(); // Usamos 'as any' para contornar discrepâncias de tipos de data opcionais

      addedBatches.push(batch);
      totalPurchaseCost += item.purchasePrice;

      // 3. Atualizar o preço unitário médio do ingrediente
      await db.update(ingredients).set({
        purchasePrice: (item.purchasePrice / item.packageCount).toFixed(2),
        costPerUnit: costPerUnit.toFixed(4)
      }).where(eq(ingredients.id, item.ingredientId));
    }

    // 4. Lançar o gasto financeiro no cofre
    if (totalPurchaseCost > 0) {
      await db.insert(financialTransactions).values({
        type: "expense",
        amount: totalPurchaseCost.toFixed(2),
        description: `Compra de insumos - Fornecedor: ${input.supplier || "Geral"}`,
        date: input.date,
        category: "ingrediente"
      });
    }

    revalidatePath("/estoque");
    revalidatePath("/ingredientes");
    revalidatePath("/financeiro");
    revalidatePath("/");

    return {
      success: true,
      message: `Compra registrada com sucesso!
- Fornecedor: ${input.supplier || "Não informado"}
- Total Gasto: R$ ${totalPurchaseCost.toFixed(2)} (descontado do cofre)
- Lotes inseridos no estoque: ${addedBatches.length}`,
      totalPurchaseCost,
      batches: addedBatches
    };
  }
};

const consultInventorySchema = z.object({
  ingredientNames: z.array(z.string()).optional()
});

export const consultInventoryAction = {
  name: "consult_inventory",
  description: "Consulta o saldo atual em estoque de um ou mais ingredientes.",
  inputSchema: consultInventorySchema,
  execute: async (input: z.infer<typeof consultInventorySchema>) => {
    const allIngredients = await db.select().from(ingredients).catch(() => []);
    
    // Agrupar os lotes para saber o estoque total
    const batches = await db
      .select({
        ingredientId: stockBatches.ingredientId,
        totalQuantity: stockBatches.totalQuantity
      })
      .from(stockBatches)
      .catch(() => []);

    const totals = new Map<number, number>();
    batches.forEach(b => {
      totals.set(b.ingredientId, (totals.get(b.ingredientId) || 0) + Number(b.totalQuantity || 0));
    });

    const results = allIngredients.map(i => {
      const currentStock = totals.get(i.id) || 0;
      return {
        id: i.id,
        name: i.name,
        unit: i.unit,
        currentStock,
        minimumStock: Number(i.minimumStock || 0),
        status: currentStock <= Number(i.minimumStock || 0) ? "Crítico / Baixo" : "Normal"
      };
    });

    // Se o usuário pediu ingredientes específicos, filtrar por nome
    const filtered = input.ingredientNames && input.ingredientNames.length > 0
      ? results.filter(r => input.ingredientNames!.some(name => r.name.toLowerCase().includes(name.toLowerCase())))
      : results;

    const listText = filtered.map(r => `  * ${r.name}: ${r.currentStock.toFixed(1)} ${r.unit} (Mínimo: ${r.minimumStock} ${r.unit}) - Status: ${r.status}`).join("\n");

    return {
      success: true,
      data: filtered,
      message: `Estoque Atual de Ingredientes:\n${listText || "  (Nenhum ingrediente correspondente encontrado)"}`
    };
  }
};


