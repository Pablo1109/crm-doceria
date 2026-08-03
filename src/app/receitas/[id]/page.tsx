export const dynamic = "force-dynamic";

import { db } from "@/db";
import { recipes, recipeIngredients, ingredients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ArrowLeft, Trash2, Plus, Scale } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addIngredientToRecipeFromForm, removeIngredientFromRecipe } from "@/app/receitas/actions";
import SubmitButton from "@/components/SubmitButton";
import Toast from "@/components/Toast";

function brNumber(value: unknown) {
  return Number(value || 0).toLocaleString("pt-BR");
}

export default async function ReceitaDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams?: Promise<{ success?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const recipeId = parseInt(id);
  
  const recipe = await db.query.recipes.findFirst({ where: eq(recipes.id, recipeId) });
  if (!recipe) notFound();

  const recipeItems = await db.select({
    id: recipeIngredients.id,
    quantity: recipeIngredients.quantity,
    ingredientName: ingredients.name,
    ingredientUnit: ingredients.unit,
    costPerUnit: ingredients.costPerUnit,
    ingredientId: ingredients.id,
    packageLabel: ingredients.packageLabel,
    purchaseQuantity: ingredients.purchaseQuantity,
  })
  .from(recipeIngredients)
  .innerJoin(ingredients, eq(recipeIngredients.ingredientId, ingredients.id))
  .where(eq(recipeIngredients.recipeId, recipeId));

  const allIngredients = await db.select().from(ingredients).orderBy(ingredients.name);

  const ingredientsCost = recipeItems.reduce((acc, item) => acc + (parseFloat(item.costPerUnit) * parseFloat(item.quantity)), 0);
  const laborCost = parseFloat(recipe.laborCost || "0");
  const totalCost = ingredientsCost + laborCost;
  const markup = parseFloat(recipe.markup || "100");
  const profit = totalCost * (markup / 100);
  const suggestedPrice = totalCost + profit;

  async function handleAddIngredient(formData: FormData) {
    "use server";
    await addIngredientToRecipeFromForm(recipeId, formData);
  }

  return (
    <div className="space-y-8">
      <Toast type={sp?.success} />
      <Link href="/receitas" className="flex items-center text-[#8b6a5d] transition-colors hover:text-[#c98b9b]">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para receitas
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card-soft rounded-[2rem] p-6">
            <p className="text-sm font-black uppercase tracking-widest text-[#c98b9b]">Receita cadastrada</p>
            <h1 className="mb-2 text-3xl font-black text-[#5b382d]">{recipe.name}</h1>
            <p className="text-[#8b6a5d]">{recipe.description || "Sem descrição."}</p>
          </div>

          <div className="card-soft overflow-hidden rounded-[2rem]">
            <div className="flex items-center justify-between border-b border-[#ead8cf] bg-[#fff8ef] p-5">
              <h2 className="flex items-center font-black text-[#5b382d]">
                <Scale className="mr-2 h-5 w-5 text-[#c98b9b]" />
                Ingredientes da receita
              </h2>
            </div>
            <table className="min-w-full divide-y divide-[#f0ded6]">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-black uppercase text-[#9a6d5c]">Ingrediente</th>
                  <th className="px-6 py-3 text-left text-xs font-black uppercase text-[#9a6d5c]">Uso na receita</th>
                  <th className="px-6 py-3 text-left text-xs font-black uppercase text-[#9a6d5c]">Custo</th>
                  <th className="px-6 py-3 text-right text-xs font-black uppercase text-[#9a6d5c]">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ded6]">
                {recipeItems.map((item) => {
                  const itemCost = parseFloat(item.costPerUnit) * parseFloat(item.quantity);
                  const qty = Number(item.quantity || 0);
                  const packageSize = Number(item.purchaseQuantity || 0);
                  const fullPackages = packageSize > 0 && qty % packageSize === 0 ? qty / packageSize : null;
                  return (
                    <tr key={item.id} className="hover:bg-[#fff1f4]/60">
                      <td className="px-6 py-4 text-sm font-black text-[#5b382d]">{item.ingredientName}</td>
                      <td className="px-6 py-4 text-sm text-[#7b4b3f]">
                        {fullPackages ? `${brNumber(fullPackages)} ${item.packageLabel}${fullPackages > 1 ? "s" : ""} inteiro${fullPackages > 1 ? "s" : ""}` : `${brNumber(qty)}${item.ingredientUnit}`}
                        <div className="text-xs text-[#9a6d5c]">Equivale a {brNumber(qty)} {item.ingredientUnit}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-[#c98b9b]">R$ {itemCost.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">
                        <form action={async () => { "use server"; await removeIngredientFromRecipe(item.id, recipeId); }}>
                          <SubmitButton pendingText="" className="rounded-xl p-2 text-red-400 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </SubmitButton>
                        </form>
                      </td>
                    </tr>
                  );
                })}
                {recipeItems.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-8 text-center italic text-[#9a6d5c]">Nenhum ingrediente adicionado.</td></tr>
                )}
              </tbody>
            </table>

            <div className="border-t border-[#ead8cf] bg-[#fff8ef] p-5">
              <form action={handleAddIngredient} className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_.8fr_.8fr_.8fr_auto] lg:items-end">
                <label className="block text-xs font-black uppercase tracking-wider text-[#9a6d5c]">Ingrediente
                  <select name="ingredientId" required className="mt-2 w-full rounded-2xl border border-[#ead8cf] px-4 py-3 text-sm normal-case">
                    <option value="">Selecione um ingrediente...</option>
                    {allIngredients.map(ing => (
                      <option key={ing.id} value={ing.id}>{ing.name} — 1 {ing.packageLabel} = {brNumber(ing.purchaseQuantity)}{ing.unit}</option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-black uppercase tracking-wider text-[#9a6d5c]">Forma de uso
                  <select name="usageMode" className="mt-2 w-full rounded-2xl border border-[#ead8cf] px-4 py-3 text-sm normal-case">
                    <option value="manual">Quantidade manual</option>
                    <option value="package">Embalagem inteira</option>
                  </select>
                </label>

                <label className="block text-xs font-black uppercase tracking-wider text-[#9a6d5c]">Qtd manual
                  <input name="quantity" type="number" step="0.01" placeholder="Ex: 200" className="mt-2 w-full rounded-2xl border border-[#ead8cf] px-4 py-3 text-sm" />
                </label>

                <label className="block text-xs font-black uppercase tracking-wider text-[#9a6d5c]">Qtd embalagem
                  <input name="packageCount" type="number" step="0.01" placeholder="Ex: 1" className="mt-2 w-full rounded-2xl border border-[#ead8cf] px-4 py-3 text-sm" />
                </label>

                <SubmitButton pendingText="Adicionando..." className="rounded-2xl bg-[#5b382d] px-4 py-3 text-sm font-black text-white hover:bg-[#c98b9b]">
                  <Plus className="mr-1 h-4 w-4" /> Adicionar
                </SubmitButton>
              </form>
              <p className="mt-3 text-xs leading-5 text-[#8b6a5d]">Para usar uma embalagem inteira, escolha “Embalagem inteira” e preencha só “Qtd embalagem”. Ex: 1 caixa de leite condensado.</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-soft rounded-[2rem] border-2 border-[#f1d8cf] p-6">
            <h2 className="mb-6 border-b border-[#ead8cf] pb-2 text-lg font-black text-[#5b382d]">Resumo financeiro</h2>
            <div className="space-y-4">
              <div className="flex justify-between text-sm"><span className="text-[#8b6a5d]">Rendimento da Receita:</span><span className="font-bold">{recipe.yield} unidades</span></div>
              <div className="flex justify-between text-sm"><span className="text-[#8b6a5d]">Custo Ingredientes:</span><span className="font-bold">R$ {ingredientsCost.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[#8b6a5d]">Mão de Obra:</span><span className="font-bold">R$ {laborCost.toFixed(2)}</span></div>
              <div className="flex justify-between border-t border-[#ead8cf] pt-2 text-base font-black"><span className="text-[#5b382d]">Custo Total:</span><span>R$ {totalCost.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-[#8b6a5d]">Custo por Unidade:</span><span className="font-bold text-rose-500">R$ {(totalCost / (recipe.yield || 1)).toFixed(2)}</span></div>
              
              <div className="flex justify-between text-sm text-emerald-600"><span>Lucro Desejado ({markup}%):</span><span>+ R$ {profit.toFixed(2)}</span></div>
              
              <div className="mt-6 border-t border-[#ead8cf] pt-4">
                <div className="rounded-3xl bg-[#5b382d] p-5 text-center text-white shadow-inner">
                  <p className="mb-1 text-xs font-black uppercase opacity-80">Preço sugerido total</p>
                  <p className="text-2xl font-black">R$ {suggestedPrice.toFixed(2)}</p>
                  <p className="mt-1 text-xs opacity-75">Sugerido por Unidade: R$ {(suggestedPrice / (recipe.yield || 1)).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
