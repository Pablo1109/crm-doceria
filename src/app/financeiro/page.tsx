import { db } from "@/db";
import { financialTransactions, orders, orderItems, recipes, recipeIngredients, ingredients } from "@/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import FinanceiroClient from "./FinanceiroClient";
import Toast from "@/components/Toast";

export default async function FinanceiroPage({ searchParams }: { searchParams?: Promise<{ success?: string }> }) {
  const params = await searchParams;
  
  // 1. Buscar todas as transações do livro-caixa ordenadas por data descrescente
  const transactions = await db
    .select()
    .from(financialTransactions)
    .orderBy(desc(financialTransactions.date), desc(financialTransactions.createdAt));

  // 2. Buscar itens de pedidos concluídos/entregues para calcular custo exato de produção (Lucro Real)
  const completedOrderItems = await db
    .select({
      orderId: orders.id,
      deliveryDate: orders.deliveryDate,
      totalAmount: orders.totalAmount,
      quantity: orderItems.quantity,
      recipeId: recipes.id,
      recipeYield: recipes.yield,
      ingredientId: recipeIngredients.ingredientId,
      ingredientQty: recipeIngredients.quantity,
      ingredientCostPerUnit: ingredients.costPerUnit,
    })
    .from(orders)
    .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
    .innerJoin(recipes, eq(orderItems.recipeId, recipes.id))
    .innerJoin(recipeIngredients, eq(recipes.id, recipeIngredients.recipeId))
    .innerJoin(ingredients, eq(recipeIngredients.ingredientId, ingredients.id))
    .where(inArray(orders.status, ["finished", "delivered"]))
    .catch(() => []); // Prevenir erros caso as tabelas estejam vazias

  // 3. Agrupar custos de ingredientes por pedido
  const orderCostMap = new Map<number, { orderId: number; date: string; revenue: number; cost: number }>();
  
  if (Array.isArray(completedOrderItems)) {
    completedOrderItems.forEach((row) => {
      const orderId = row.orderId;
      const recipeYield = Number(row.recipeYield || 1) || 1;
      const orderQty = Number(row.quantity);
      const ingredientQty = Number(row.ingredientQty);
      const costPerUnit = Number(row.ingredientCostPerUnit);
      
      const ingredientCostForThisItem = costPerUnit * ingredientQty * (orderQty / recipeYield);
      
      const existing = orderCostMap.get(orderId) || {
        orderId: orderId,
        date: row.deliveryDate,
        revenue: Number(row.totalAmount || 0),
        cost: 0,
      };
      existing.cost += ingredientCostForThisItem;
      orderCostMap.set(orderId, existing);
    });
  }

  const orderCosts = Array.from(orderCostMap.values());

  return (
    <div className="space-y-7">
      <Toast type={params?.success} />
      <div>
        <p className="text-sm font-black uppercase tracking-widest text-rose-400">Organização financeira</p>
        <h1 className="text-3xl font-black text-slate-950">Gestão do Caixa e Cofre</h1>
        <p className="text-slate-500 text-sm mt-1">
          Acompanhe o saldo real em dinheiro no cofre físico da doceria e analise o lucro real por quinzena com base no custo de produção dos doces.
        </p>
      </div>

      <FinanceiroClient 
        transactions={transactions} 
        orderCosts={orderCosts} 
      />
    </div>
  );
}
