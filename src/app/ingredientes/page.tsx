import { db } from "@/db";
import { ingredients } from "@/db/schema";
import { addIngredient, deleteIngredient } from "./actions";
import { Boxes, Plus, Trash2 } from "lucide-react";
import { asc } from "drizzle-orm";
import { money, numberValue } from "@/lib/format";
import SubmitButton from "@/components/SubmitButton";
import Toast from "@/components/Toast";

export default async function IngredientesPage({ searchParams }: { searchParams?: Promise<{ success?: string }> }) {
  const params = await searchParams;
  const allIngredients = await db.select().from(ingredients).orderBy(asc(ingredients.name));

  return (
    <div className="space-y-8">
      <Toast type={params?.success} />
      <div>
        <p className="text-sm font-black uppercase tracking-widest text-[#c98b9b]">Base de cadastro</p>
        <h1 className="text-3xl font-black text-[#5b382d]">Ingredientes</h1>
        <p className="text-[#8b6a5d]">Aqui você cadastra que o ingrediente existe. A quantidade física fica só na aba Estoque.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="card-soft h-fit rounded-[2rem] p-6">
          <h2 className="mb-4 flex items-center text-xl font-black text-[#5b382d]">
            <Plus className="mr-2 h-5 w-5 text-[#c98b9b]" />
            Novo ingrediente
          </h2>
          <form action={addIngredient} className="space-y-4">
            <label className="block text-xs font-black uppercase tracking-wider text-[#9a6d5c]">Nome do ingrediente
              <input name="name" required className="mt-2 w-full rounded-2xl border border-[#ead8cf] px-4 py-3" placeholder="Ex: Leite condensado" />
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-xs font-black uppercase tracking-wider text-[#9a6d5c]">Embalagem padrão
                <select name="packageLabel" className="mt-2 w-full rounded-2xl border border-[#ead8cf] px-4 py-3">
                  <option value="caixa">Caixa</option>
                  <option value="lata">Lata</option>
                  <option value="pacote">Pacote</option>
                  <option value="pote">Pote</option>
                  <option value="saco">Saco</option>
                  <option value="unidade">Unidade</option>
                </select>
              </label>
              <label className="block text-xs font-black uppercase tracking-wider text-[#9a6d5c]">Medida usada nas receitas
                <select name="unit" className="mt-2 w-full rounded-2xl border border-[#ead8cf] px-4 py-3">
                  <option value="g">Gramas (g)</option>
                  <option value="ml">Mililitros (ml)</option>
                  <option value="un">Unidade (un)</option>
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-xs font-black uppercase tracking-wider text-[#9a6d5c]">Conteúdo da embalagem
                <input name="purchaseQuantity" type="number" step="0.01" required className="mt-2 w-full rounded-2xl border border-[#ead8cf] px-4 py-3" placeholder="Ex: 395" />
              </label>
              <label className="block text-xs font-black uppercase tracking-wider text-[#9a6d5c]">Preço médio da embalagem
                <input name="purchasePrice" type="number" step="0.01" className="mt-2 w-full rounded-2xl border border-[#ead8cf] px-4 py-3" placeholder="Ex: 6,50" />
              </label>
            </div>

            <label className="block text-xs font-black uppercase tracking-wider text-[#9a6d5c]">Estoque mínimo para alerta
              <input name="minimumStock" type="number" step="0.01" className="mt-2 w-full rounded-2xl border border-[#ead8cf] px-4 py-3" placeholder="Ex: 1000" />
            </label>

            <div className="rounded-2xl bg-[#fff1f4] p-4 text-sm leading-6 text-[#7b4b3f]">
              Exemplo certo: <b>Leite condensado</b> → embalagem <b>caixa</b> → medida <b>g</b> → conteúdo <b>395</b>. Se for 1kg, coloque medida <b>g</b> e conteúdo <b>1000</b>.
            </div>
            <SubmitButton pendingText="Cadastrando..." className="w-full rounded-2xl bg-[#5b382d] px-4 py-3 font-black text-white hover:bg-[#c98b9b]">
              Cadastrar ingrediente
            </SubmitButton>
          </form>
        </div>

        <div className="card-soft overflow-hidden rounded-[2rem] lg:col-span-2">
          <div className="border-b border-[#ead8cf] p-5">
            <h2 className="flex items-center gap-2 text-xl font-black text-[#5b382d]"><Boxes className="h-5 w-5 text-[#c98b9b]" /> Ingredientes cadastrados</h2>
            <p className="text-sm text-[#8b6a5d]">Não é estoque. É só a base para receitas e entradas de compra.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#f0ded6]">
              <thead className="bg-[#fff8ef]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider text-[#9a6d5c]">Ingrediente</th>
                  <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider text-[#9a6d5c]">Embalagem padrão</th>
                  <th className="px-6 py-3 text-left text-xs font-black uppercase tracking-wider text-[#9a6d5c]">Custo estimado</th>
                  <th className="px-6 py-3 text-right text-xs font-black uppercase tracking-wider text-[#9a6d5c]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ded6] bg-white">
                {allIngredients.map((item) => (
                  <tr key={item.id} className="hover:bg-[#fff1f4]/60">
                    <td className="px-6 py-4">
                      <div className="font-black text-[#5b382d]">{item.name}</div>
                      <div className="text-xs text-[#9a6d5c]">Usado nas receitas em {item.unit}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#7b4b3f]">
                      1 {item.packageLabel || "unidade"} = {numberValue(item.purchaseQuantity).toLocaleString("pt-BR")} {item.unit}
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-[#c98b9b]">
                      {money(item.costPerUnit)} / {item.unit}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <form action={async () => { "use server"; await deleteIngredient(item.id); }}>
                        <SubmitButton pendingText="" className="rounded-xl p-2 text-red-400 hover:bg-red-50 hover:text-red-600" >
                          <Trash2 className="h-5 w-5" />
                        </SubmitButton>
                      </form>
                    </td>
                  </tr>
                ))}
                {allIngredients.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-[#9a6d5c]">Nenhum ingrediente cadastrado ainda.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
