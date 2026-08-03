import { db } from "@/db";
import { recipes, recipeIngredients, ingredients } from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import Link from "next/link";
import { Plus, ChevronRight, Calculator } from "lucide-react";
import { deleteRecipe } from "./actions";

export const dynamic = "force-dynamic";

export default async function ReceitasPage() {
  const allRecipes = await db.select().from(recipes).orderBy(recipes.name);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Fichas Técnicas</h1>
          <p className="text-gray-500">Suas receitas e custos de produção</p>
        </div>
        <Link 
          href="/receitas/nova" 
          className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors flex items-center shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nova Receita
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allRecipes.map(async (recipe) => {
          // Calculate total cost for this recipe
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

          return (
            <div key={recipe.id} className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900">{recipe.name}</h3>
                <span className="bg-pink-100 text-pink-700 text-xs font-bold px-2 py-1 rounded">
                  Rende {recipe.yield} un • {recipe.markup}% Markup
                </span>
              </div>
              
              <p className="text-sm text-gray-500 mb-6 line-clamp-2 h-10">
                {recipe.description || "Sem descrição."}
              </p>

              <div className="space-y-2 border-t pt-4 mb-6">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Custo total:</span>
                  <span className="font-medium">R$ {totalCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Sugerido un.:</span>
                  <span className="font-medium text-emerald-600">R$ {(suggestedPrice / (recipe.yield || 1)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-pink-600">
                  <span>Sugerido total:</span>
                  <span>R$ {suggestedPrice.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Link 
                  href={`/receitas/${recipe.id}`}
                  className="flex-1 bg-gray-50 text-gray-700 text-center py-2 rounded-md hover:bg-gray-100 transition-colors text-sm font-medium border"
                >
                  Ver Detalhes
                </Link>
                <form action={async () => { "use server"; await deleteRecipe(recipe.id); }}>
                  <button type="submit" className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-100">
                    Excluir
                  </button>
                </form>
              </div>
            </div>
          );
        })}
        {allRecipes.length === 0 && (
          <div className="col-span-full bg-white p-12 rounded-xl border border-dashed text-center">
            <Calculator className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Você ainda não tem receitas cadastradas.</p>
            <Link href="/receitas/nova" className="text-pink-600 font-medium hover:underline mt-2 inline-block">
              Comece criando sua primeira ficha técnica
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
