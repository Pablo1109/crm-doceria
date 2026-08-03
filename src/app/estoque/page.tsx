import { db } from "@/db";
import { ingredients, stockBatches, orders, orderItems, recipeIngredients, recipes } from "@/db/schema";
import { and, asc, eq, gte, inArray } from "drizzle-orm";
import EstoqueClient from "./EstoqueClient";
import Toast from "@/components/Toast";
import Link from "next/link";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EstoquePage({ searchParams }: { searchParams?: Promise<{ success?: string }> }) {
  const params = await searchParams;
  const allIngredients = await db.select().from(ingredients).orderBy(asc(ingredients.name));
  
  const batches = await db.select({
    id: stockBatches.id,
    ingredientId: stockBatches.ingredientId,
    ingredientName: ingredients.name,
    packageLabel: stockBatches.packageLabel,
    packageCount: stockBatches.packageCount,
    quantityPerPackage: stockBatches.quantityPerPackage,
    unit: stockBatches.unit,
    totalQuantity: stockBatches.totalQuantity,
    totalPrice: stockBatches.totalPrice,
    costPerUnit: stockBatches.costPerUnit,
    supplier: stockBatches.supplier,
    expiresAt: stockBatches.expiresAt,
    createdAt: stockBatches.createdAt,
  }).from(stockBatches).innerJoin(ingredients, eq(stockBatches.ingredientId, ingredients.id)).orderBy(asc(ingredients.name));

  // Calcular consumo nos últimos 30 dias para estimar duração
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Buscar pedidos dos últimos 30 dias que foram concluídos ou entregues
  const recentOrders = await db
    .select({
      orderQty: orderItems.quantity,
      recipeQty: recipeIngredients.quantity,
      recipeYield: recipes.yield,
      ingredientId: recipeIngredients.ingredientId,
    })
    .from(orders)
    .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
    .innerJoin(recipeIngredients, eq(orderItems.recipeId, recipeIngredients.recipeId))
    .innerJoin(recipes, eq(orderItems.recipeId, recipes.id))
    .where(
      and(
        gte(orders.deliveryDate, thirtyDaysAgo.toISOString().split("T")[0]),
        inArray(orders.status, ["finished", "delivered"])
      )
    ).catch(() => []); // Prevenir quebra caso tabelas estejam vazias

  const consumptionMap: Record<number, number> = {};
  if (Array.isArray(recentOrders)) {
    recentOrders.forEach((o) => {
      const yieldVal = Number(o.recipeYield || 1) || 1;
      const totalUsed = Number(o.recipeQty) * (Number(o.orderQty) / yieldVal);
      consumptionMap[o.ingredientId] = (consumptionMap[o.ingredientId] || 0) + totalUsed;
    });
  }

  return (
    <div className="space-y-7">
      <Toast type={params?.success} />
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-[#c98b9b]">Controle Físico e Visual</p>
          <h1 className="text-3xl font-black text-[#5b382d]">Estoque da Doceria</h1>
          <p className="text-[#8b6a5d] text-sm mt-1">Veja seus ingredientes organizados de forma visual. Dê baixa nos ingredientes automaticamente ao finalizar pedidos.</p>
        </div>
        <Link href="/ingredientes" className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-[#c98b9b] self-start md:self-auto">
          <Plus className="mr-2 h-5 w-5" /> Cadastrar Ingrediente
        </Link>
      </div>

      <EstoqueClient 
        ingredients={allIngredients} 
        batches={batches} 
        consumptionMap={consumptionMap} 
      />
    </div>
  );
}
