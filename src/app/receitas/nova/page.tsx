import { createRecipe } from "@/app/receitas/actions";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default function NovaReceitaPage() {
  async function handleSubmit(formData: FormData) {
    "use server";
    const id = await createRecipe(formData);
    redirect(`/receitas/${id}`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/receitas" className="flex items-center text-gray-500 hover:text-pink-600 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar para receitas
      </Link>

      <div className="bg-white p-8 rounded-xl shadow-sm border">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Nova Receita</h1>
        
        <form action={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Receita</label>
            <input
              name="name"
              required
              className="w-full border p-2 rounded-md focus:ring-pink-500 focus:border-pink-500"
              placeholder="Ex: Bolo de Chocolate Belga"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              name="description"
              rows={3}
              className="w-full border p-2 rounded-md focus:ring-pink-500 focus:border-pink-500"
              placeholder="Descreva brevemente o produto..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Custo de Mão de Obra (R$)</label>
              <input
                name="laborCost"
                type="number"
                step="0.01"
                defaultValue="0"
                className="w-full border p-2 rounded-md focus:ring-pink-500 focus:border-pink-500"
              />
              <p className="text-[10px] text-gray-400 mt-1">Quanto tempo você gasta para fazer?</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Markup (%)</label>
              <input
                name="markup"
                type="number"
                defaultValue="100"
                className="w-full border p-2 rounded-md focus:ring-pink-500 focus:border-pink-500"
              />
              <p className="text-[10px] text-gray-400 mt-1">Porcentagem de lucro sobre o custo</p>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors font-bold text-lg"
          >
            Criar e Adicionar Ingredientes
          </button>
        </form>
      </div>
    </div>
  );
}
