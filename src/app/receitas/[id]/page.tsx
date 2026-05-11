import { db } from "@/db";
import { recipes, recipeIngredients, ingredients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ArrowLeft, Trash2, Plus, Scale } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addIngredientToRecipe, removeIngredientFromRecipe } from "@/app/receitas/actions";

export default async function ReceitaDetailPage({ params }: { params: { id: string } }) {
  const recipeId = parseInt(params.id);
  
  const recipe = await db.query.recipes.findFirst({
    where: eq(recipes.id, recipeId),
  });

  if (!recipe) notFound();

  const recipeItems = await db.select({
    id: recipeIngredients.id,
    quantity: recipeIngredients.quantity,
    ingredientName: ingredients.name,
    ingredientUnit: ingredients.unit,
    costPerUnit: ingredients.costPerUnit,
    ingredientId: ingredients.id,
  })
  .from(recipeIngredients)
  .innerJoin(ingredients, eq(recipeIngredients.ingredientId, ingredients.id))
  .where(eq(recipeIngredients.recipeId, recipeId));

  const allIngredients = await db.select().from(ingredients).orderBy(ingredients.name);

  const ingredientsCost = recipeItems.reduce((acc, item) => {
    return acc + (parseFloat(item.costPerUnit) * parseFloat(item.quantity));
  }, 0);

  const laborCost = parseFloat(recipe.laborCost || "0");
  const totalCost = ingredientsCost + laborCost;
  const markup = parseFloat(recipe.markup || "100");
  const profit = totalCost * (markup / 100);
  const suggestedPrice = totalCost + profit;

  async function handleAddIngredient(formData: FormData) {
    "use server";
    const ingredientId = parseInt(formData.get("ingredientId") as string);
    const quantity = parseFloat(formData.get("quantity") as string);
    await addIngredientToRecipe(recipeId, ingredientId, quantity);
  }

  return (
    <div className="space-y-8">
      <Link href="/receitas" className="flex items-center text-gray-500 hover:text-pink-600 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar para receitas
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{recipe.name}</h1>
            <p className="text-gray-500">{recipe.description}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="font-bold text-gray-700 flex items-center">
                <Scale className="w-5 h-5 mr-2 text-pink-500" />
                Ingredientes na Receita
              </h2>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qtd</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Custo</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recipeItems.map((item) => {
                  const itemCost = parseFloat(item.costPerUnit) * parseFloat(item.quantity);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.ingredientName}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{item.quantity}{item.ingredientUnit}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">R$ {itemCost.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">
                        <form action={async () => { "use server"; await removeIngredientFromRecipe(item.id, recipeId); }}>
                          <button type="submit" className="text-red-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
                {recipeItems.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400 italic">
                      Nenhum ingrediente adicionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Form to add item */}
            <div className="p-4 bg-pink-50 border-t">
              <form action={handleAddIngredient} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <select 
                  name="ingredientId" 
                  required
                  className="rounded-md border-gray-300 text-sm p-2 border"
                >
                  <option value="">Selecione um ingrediente...</option>
                  {allIngredients.map(ing => (
                    <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                  ))}
                </select>
                <div className="relative">
                  <input 
                    name="quantity" 
                    type="number" 
                    step="0.01" 
                    required 
                    placeholder="Quantidade"
                    className="w-full rounded-md border-gray-300 text-sm p-2 border"
                  />
                </div>
                <button 
                  type="submit"
                  className="bg-pink-600 text-white rounded-md px-4 py-2 text-sm font-bold hover:bg-pink-700 transition-colors flex items-center justify-center"
                >
                  <Plus className="w-4 h-4 mr-1" /> Adicionar
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-pink-100">
            <h2 className="text-lg font-bold text-gray-800 mb-6 border-b pb-2">Resumo Financeiro</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Custo Ingredientes:</span>
                <span className="font-medium">R$ {ingredientsCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Mão de Obra:</span>
                <span className="font-medium">R$ {laborCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t">
                <span className="text-gray-700">Custo Total:</span>
                <span>R$ {totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600">
                <span>Lucro Desejado ({markup}%):</span>
                <span>+ R$ {profit.toFixed(2)}</span>
              </div>
              
              <div className="mt-8 p-4 bg-pink-600 text-white rounded-lg shadow-inner text-center">
                <p className="text-xs uppercase font-bold opacity-80 mb-1">Preço Sugerido</p>
                <p className="text-3xl font-black">R$ {suggestedPrice.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
