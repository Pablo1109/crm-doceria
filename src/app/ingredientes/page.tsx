import { db } from "@/db";
import { ingredients } from "@/db/schema";
import { addIngredient, deleteIngredient } from "./actions";
import { Boxes, Plus, Trash2 } from "lucide-react";
import { asc } from "drizzle-orm";
import { money, numberValue } from "@/lib/format";

export default async function IngredientesPage() {
  const allIngredients = await db.select().from(ingredients).orderBy(asc(ingredients.name));

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-black uppercase tracking-widest text-rose-400">Base de cadastro</p>
        <h1 className="text-3xl font-black text-slate-950">Ingredientes</h1>
        <p className="text-slate-500">Aqui você cadastra que o ingrediente existe. A quantidade física fica na aba Estoque.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="h-fit rounded-[2rem] bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center text-xl font-black">
            <Plus className="mr-2 h-5 w-5 text-rose-500" />
            Novo ingrediente
          </h2>
          <form action={addIngredient} className="space-y-4">
            <input name="name" required className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Ex: Leite condensado" />
            <div className="grid grid-cols-2 gap-3">
              <select name="packageLabel" className="rounded-2xl border border-slate-200 px-4 py-3">
                <option value="caixa">Caixa</option>
                <option value="lata">Lata</option>
                <option value="pacote">Pacote</option>
                <option value="pote">Pote</option>
                <option value="unidade">Unidade</option>
                <option value="kg">Kg</option>
              </select>
              <select name="unit" className="rounded-2xl border border-slate-200 px-4 py-3">
                <option value="g">Gramas (g)</option>
                <option value="ml">Mililitros (ml)</option>
                <option value="un">Unidade (un)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input name="purchaseQuantity" type="number" step="0.01" required className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Qtd por embalagem" />
              <input name="purchasePrice" type="number" step="0.01" className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Preço padrão" />
            </div>
            <input name="minimumStock" type="number" step="0.01" className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Estoque mínimo para alerta" />
            <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
              Exemplo: Leite condensado, caixa, 395g. Depois, no estoque, você lança “5 caixas”.
            </div>
            <button type="submit" className="w-full rounded-2xl bg-slate-950 px-4 py-3 font-black text-white hover:bg-rose-600">
              Cadastrar ingrediente
            </button>
          </form>
        </div>

        <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm lg:col-span-2">
          <div className="border-b border-slate-100 p-5">
            <h2 className="flex items-center gap-2 text-xl font-black text-slate-950"><Boxes className="h-5 w-5 text-rose-500" /> Ingredientes cadastrados</h2>
            <p className="text-sm text-slate-500">Não é estoque. É só a base para receitas e entradas de compra.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-400">Ingrediente</th>
                  <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-400">Embalagem padrão</th>
                  <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-400">Custo estimado</th>
                  <th className="px-6 py-3 text-right text-xs font-black uppercase tracking-wider text-slate-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {allIngredients.map((item) => (
                  <tr key={item.id} className="hover:bg-rose-50/40">
                    <td className="px-6 py-4">
                      <div className="font-black text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-400">Usado nas receitas em {item.unit}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      1 {item.packageLabel || "unidade"} = {numberValue(item.purchaseQuantity).toLocaleString("pt-BR")} {item.unit}
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-rose-600">
                      {money(item.costPerUnit)} / {item.unit}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <form action={async () => { "use server"; await deleteIngredient(item.id); }}>
                        <button type="submit" className="rounded-xl p-2 text-red-400 hover:bg-red-50 hover:text-red-600" title="Excluir ingrediente e lotes de estoque">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
                {allIngredients.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400">Nenhum ingrediente cadastrado ainda.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
