"use client";
import { useState } from "react";
import { ArrowLeft, Plus, Trash2, Scale } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createRecipe } from "@/app/receitas/actions";
import SubmitButton from "@/components/SubmitButton";

type Ingredient = {
  id: number;
  name: string;
  unit: string;
  packageLabel: string | null;
  purchaseQuantity: string;
  costPerUnit: string;
};

type NovaReceitaClientProps = {
  ingredientsList: Ingredient[];
};

type RecipeIngredientItem = {
  id: string; // id temporário cliente (ex: random string ou index)
  ingredientId: number;
  usageMode: "manual" | "package";
  quantity: number;
  packageCount: number;
};

export default function NovaReceitaClient({ ingredientsList }: NovaReceitaClientProps) {
  const router = useRouter();
  const [items, setItems] = useState<RecipeIngredientItem[]>([]);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        ingredientId: ingredientsList[0]?.id || 0,
        usageMode: "manual",
        quantity: 0,
        packageCount: 1,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleFieldChange = (id: string, field: keyof RecipeIngredientItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async (formData: FormData) => {
    // Filtrar itens inválidos ou vazios
    const validItems = items.filter((item) => item.ingredientId > 0);
    formData.set("ingredientsJson", JSON.stringify(validItems));
    
    try {
      const id = await createRecipe(formData);
      router.push(`/receitas/${id}?success=receita`);
      router.refresh();
    } catch (err) {
      console.error("Erro no envio:", err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link href="/receitas" className="flex items-center text-[#8b6a5d] hover:text-[#c98b9b] transition-colors font-bold text-sm">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar para receitas
      </Link>

      <div className="bg-white rounded-[2rem] border border-[#ead8cf] p-6 md:p-8 shadow-sm">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[#c98b9b]">Nova ficha técnica</p>
          <h1 className="text-3xl font-black text-[#5b382d] mt-1.5">Nova Receita</h1>
          <p className="text-[#8b6a5d] text-sm mt-1">
            Cadastre o nome, custos basais e selecione os ingredientes que compõem essa receita.
          </p>
        </div>

        <form action={handleSubmit} className="space-y-6 mt-6 border-t border-[#ead8cf]/40 pt-6">
          
          {/* Dados Gerais da Receita */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block text-xs font-black uppercase tracking-wider text-[#9a6d5c]">Nome da Receita
              <input
                name="name"
                required
                className="mt-2 w-full rounded-2xl border border-[#ead8cf] bg-[#fff8ef]/20 px-4 py-3 text-sm font-semibold focus:outline-none"
                placeholder="Ex: Beijinho de Coco Tradicional"
              />
            </label>

            <label className="block text-xs font-black uppercase tracking-wider text-[#9a6d5c]">Rendimento da Receita (Unidades de Doce)
              <input
                name="yield"
                type="number"
                required
                defaultValue="35"
                className="mt-2 w-full rounded-2xl border border-[#ead8cf] bg-[#fff8ef]/20 px-4 py-3 text-sm font-semibold focus:outline-none"
                placeholder="Ex: 35"
              />
            </label>
          </div>

          <label className="block text-xs font-black uppercase tracking-wider text-[#9a6d5c]">Descrição
            <textarea
              name="description"
              rows={2}
              className="mt-2 w-full rounded-2xl border border-[#ead8cf] bg-[#fff8ef]/20 px-4 py-3 text-sm font-semibold focus:outline-none"
              placeholder="Ex: Receita clássica de beijinho para festas..."
            />
          </label>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block text-xs font-black uppercase tracking-wider text-[#9a6d5c]">Custo de Mão de Obra (R$)
              <input
                name="laborCost"
                type="number"
                step="0.01"
                defaultValue="0.00"
                className="mt-2 w-full rounded-2xl border border-[#ead8cf] bg-[#fff8ef]/20 px-4 py-3 text-sm font-semibold focus:outline-none"
              />
            </label>

            <label className="block text-xs font-black uppercase tracking-wider text-[#9a6d5c]">Markup de Lucro (%)
              <input
                name="markup"
                type="number"
                defaultValue="100"
                className="mt-2 w-full rounded-2xl border border-[#ead8cf] bg-[#fff8ef]/20 px-4 py-3 text-sm font-semibold focus:outline-none"
              />
            </label>
          </div>

          {/* Seleção de Ingredientes */}
          <div className="border-t border-[#ead8cf]/40 pt-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-black text-[#5b382d] flex items-center gap-1.5">
                <Scale className="h-5 w-5 text-[#c98b9b]" /> Ingredientes Requeridos
              </h2>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#ead8cf] bg-[#fff8ef]/40 hover:bg-[#fff1f4] px-3.5 py-2 text-xs font-black text-[#5b382d] cursor-pointer transition"
              >
                <Plus className="h-4 w-4 text-[#c98b9b]" /> Adicionar Ingrediente
              </button>
            </div>

            {/* Listagem de Ingredientes dinâmicos */}
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-1 gap-3 sm:grid-cols-[1.5fr_1fr_1fr_auto] items-end bg-[#fffcf9] border border-[#ead8cf] p-4 rounded-2xl animate-toast-in">
                  
                  <label className="block text-[10px] font-black uppercase text-[#9a6d5c]">Ingrediente
                    <select
                      value={item.ingredientId}
                      onChange={(e) => handleFieldChange(item.id, "ingredientId", Number(e.target.value))}
                      className="mt-1.5 w-full rounded-xl border border-[#ead8cf] bg-white px-3 py-2 text-xs cursor-pointer focus:outline-none"
                    >
                      {ingredientsList.map((ing) => (
                        <option key={ing.id} value={ing.id}>
                          {ing.name} ({ing.unit})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-[10px] font-black uppercase text-[#9a6d5c]">Modo de Uso
                    <select
                      value={item.usageMode}
                      onChange={(e) => handleFieldChange(item.id, "usageMode", e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-[#ead8cf] bg-white px-3 py-2 text-xs cursor-pointer focus:outline-none"
                    >
                      <option value="manual">Quantidade manual</option>
                      <option value="package">Embalagem inteira</option>
                    </select>
                  </label>

                  {item.usageMode === "manual" ? (
                    <label className="block text-[10px] font-black uppercase text-[#9a6d5c]">Qtd na Receita
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 395"
                        value={item.quantity || ""}
                        onChange={(e) => handleFieldChange(item.id, "quantity", Number(e.target.value))}
                        className="mt-1.5 w-full rounded-xl border border-[#ead8cf] bg-white px-3 py-2 text-xs focus:outline-none"
                      />
                    </label>
                  ) : (
                    <label className="block text-[10px] font-black uppercase text-[#9a6d5c]">Qtd Embalagens
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 1"
                        value={item.packageCount || ""}
                        onChange={(e) => handleFieldChange(item.id, "packageCount", Number(e.target.value))}
                        className="mt-1.5 w-full rounded-xl border border-[#ead8cf] bg-white px-3 py-2 text-xs focus:outline-none"
                      />
                    </label>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-2 border border-rose-100 hover:bg-rose-50 text-rose-400 hover:text-rose-600 rounded-xl cursor-pointer transition mb-0.5"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>

                </div>
              ))}

              {items.length === 0 && (
                <p className="text-center italic text-[#8b6a5d] text-xs py-6 bg-slate-50 border border-dashed border-[#ead8cf] rounded-2xl">
                  Nenhum ingrediente adicionado ainda. Clique em "Adicionar Ingrediente" para vincular.
                </p>
              )}
            </div>
          </div>

          <SubmitButton pendingText="Criando Receita..." className="w-full rounded-2xl bg-[#5b382d] py-4 text-sm font-black text-white hover:bg-[#c98b9b] shadow-xs">
            Salvar Receita e Ficha Técnica
          </SubmitButton>

        </form>
      </div>
    </div>
  );
}
