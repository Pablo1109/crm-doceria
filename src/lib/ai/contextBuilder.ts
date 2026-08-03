import { db } from "@/db";
import { ingredients, recipes, orders, stockBatches } from "@/db/schema";
import { sql, desc } from "drizzle-orm";

export interface SystemContext {
  ingredients: { id: number; name: string; unit: string; costPerUnit: string }[];
  recipes: { id: number; name: string; yield: number; laborCost: string; markup: string }[];
  recentSuppliers: string[];
  recentCustomers: string[];
  todayDate: string;
}

export async function buildSystemContext(): Promise<SystemContext> {
  try {
    // 1. Ingredientes ativos
    const activeIngredients = await db
      .select({
        id: ingredients.id,
        name: ingredients.name,
        unit: ingredients.unit,
        costPerUnit: ingredients.costPerUnit
      })
      .from(ingredients)
      .limit(50)
      .catch(() => []);

    // 2. Receitas ativas
    const activeRecipes = await db
      .select({
        id: recipes.id,
        name: recipes.name,
        yield: recipes.yield,
        laborCost: recipes.laborCost,
        markup: recipes.markup
      })
      .from(recipes)
      .limit(50)
      .catch(() => []);

    // 3. Fornecedores recentes
    const suppliersResult = await db
      .select({ supplier: stockBatches.supplier })
      .from(stockBatches)
      .where(sql`${stockBatches.supplier} IS NOT NULL`)
      .limit(10)
      .catch(() => []);
    
    const recentSuppliers = Array.from(new Set(
      suppliersResult.map(s => String(s.supplier || "").trim()).filter(Boolean)
    ));

    // 4. Clientes recentes
    const customersResult = await db
      .select({ customerName: orders.customerName })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(20)
      .catch(() => []);

    const recentCustomers = Array.from(new Set(
      customersResult.map(c => String(c.customerName || "").trim()).filter(Boolean)
    ));

    return {
      ingredients: activeIngredients.map(i => ({
        id: i.id,
        name: i.name,
        unit: i.unit,
        costPerUnit: i.costPerUnit || "0"
      })),
      recipes: activeRecipes.map(r => ({
        id: r.id,
        name: r.name,
        yield: Number(r.yield) || 1,
        laborCost: r.laborCost || "0",
        markup: r.markup || "100"
      })),
      recentSuppliers,
      recentCustomers,
      todayDate: new Date().toISOString().split("T")[0]
    };
  } catch (err) {
    console.error("Erro ao montar o contexto do sistema para a IA:", err);
    return {
      ingredients: [],
      recipes: [],
      recentSuppliers: [],
      recentCustomers: [],
      todayDate: new Date().toISOString().split("T")[0]
    };
  }
}

export function formatContextToString(ctx: SystemContext): string {
  return `
CONTEXTO OPERACIONAL DA DOCERIA (DADOS REAIS DO SISTEMA):
- Data de Hoje (Hoje é): ${ctx.todayDate}

INGREDIENTES CADASTRADOS (SELECIONE DA LISTA ABAIXO PELO ID SE EXISTIREM):
${ctx.ingredients.length > 0 
  ? ctx.ingredients.map(i => `  * ID: ${i.id} | Nome: ${i.name} (Unidade base: ${i.unit}) | Custo unitário: R$ ${i.costPerUnit}`).join("\n")
  : "  (Nenhum ingrediente cadastrado ainda)"}

RECEITAS CADASTRADAS (DOCES DISPONÍVEIS PARA ENCOMENDAS - SELECIONE PELO ID):
${ctx.recipes.length > 0 
  ? ctx.recipes.map(r => `  * ID: ${r.id} | Nome: ${r.name} | Rendimento padrão: ${r.yield} un | Mão de obra base: R$ ${r.laborCost} | Markup: ${r.markup}%`).join("\n")
  : "  (Nenhuma receita/doce cadastrada ainda)"}

FORNECEDORES QUE JÁ COMPRAMOS ANTERIORMENTE:
${ctx.recentSuppliers.length > 0 
  ? ctx.recentSuppliers.map(s => `  * ${s}`).join("\n")
  : "  (Nenhum fornecedor registrado)"}

CLIENTES RECENTES (ÚLTIMAS ENCOMENDAS):
${ctx.recentCustomers.length > 0 
  ? ctx.recentCustomers.map(c => `  * ${c}`).join("\n")
  : "  (Nenhum cliente registrado)"}
`;
}
