import { db } from "@/db";
import { ingredients, stockBatches } from "@/db/schema";
import { money, numberValue, shortDate } from "@/lib/format";
import { asc, eq } from "drizzle-orm";
import { Boxes, PackageCheck, Trash2 } from "lucide-react";
import { addStock, adjustStock, deleteStockBatch } from "@/app/ingredientes/actions";
import SubmitButton from "@/components/SubmitButton";
import Toast from "@/components/Toast";

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

  const totals = new Map<number, number>();
  batches.forEach((b) => totals.set(b.ingredientId, (totals.get(b.ingredientId) || 0) + numberValue(b.totalQuantity)));
  const totalValue = batches.reduce((s, b) => s + numberValue(b.totalQuantity) * numberValue(b.costPerUnit), 0);

  return <div className="space-y-7">
    <Toast type={params?.success} />
    <div>
      <p className="text-sm font-black uppercase tracking-widest text-[#c98b9b]">Controle físico</p>
      <h1 className="text-3xl font-black text-[#5b382d]">Estoque</h1>
      <p className="text-[#8b6a5d]">Aqui você lança o que comprou do jeito que compra no mercado: 5 caixas de 395g, 2 pacotes de 1kg, 10 unidades...</p>
    </div>

    <div className="grid gap-4 md:grid-cols-2">
      <div className="card-soft rounded-[2rem] p-6"><Boxes className="mb-4 h-6 w-6 text-[#c98b9b]" /><p className="text-xs font-black uppercase tracking-widest text-[#9a6d5c]">Ingredientes com estoque</p><p className="mt-2 text-3xl font-black text-[#5b382d]">{totals.size}</p></div>
      <div className="card-soft rounded-[2rem] p-6"><PackageCheck className="mb-4 h-6 w-6 text-emerald-500" /><p className="text-xs font-black uppercase tracking-widest text-[#9a6d5c]">Valor aproximado em estoque</p><p className="mt-2 text-3xl font-black text-[#5b382d]">{money(totalValue)}</p></div>
    </div>

    <div className="grid gap-6 lg:grid-cols-2">
      <form action={addStock} className="card-soft space-y-4 rounded-[2rem] p-6">
        <h2 className="text-xl font-black text-[#5b382d]">Entrada de compra</h2>
        <label className="block text-xs font-black uppercase tracking-wider text-[#9a6d5c]">Ingrediente comprado
          <select name="ingredientId" required className="mt-2 w-full rounded-2xl border border-[#ead8cf] px-4 py-3">
            <option value="">Selecione o ingrediente</option>
            {allIngredients.map(i => <option key={i.id} value={i.id}>{i.name} — padrão: {i.packageLabel || "unidade"} de {numberValue(i.purchaseQuantity).toLocaleString("pt-BR")}{i.unit}</option>)}
          </select>
        </label>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="block text-xs font-black uppercase tracking-wider text-[#9a6d5c]">Quantas embalagens?
            <input name="packageCount" required type="number" step="0.01" placeholder="Ex: 5" className="mt-2 w-full rounded-2xl border border-[#ead8cf] px-4 py-3" />
          </label>
          <label className="block text-xs font-black uppercase tracking-wider text-[#9a6d5c]">Tipo da embalagem
            <select name="packageLabel" className="mt-2 w-full rounded-2xl border border-[#ead8cf] px-4 py-3">
              <option value="">Usar padrão</option>
              <option value="caixa">Caixa</option>
              <option value="lata">Lata</option>
              <option value="pacote">Pacote</option>
              <option value="pote">Pote</option>
              <option value="saco">Saco</option>
              <option value="unidade">Unidade</option>
            </select>
          </label>
          <label className="block text-xs font-black uppercase tracking-wider text-[#9a6d5c]">Conteúdo por embalagem
            <input name="quantityPerPackage" required type="number" step="0.01" placeholder="Ex: 395" className="mt-2 w-full rounded-2xl border border-[#ead8cf] px-4 py-3" />
          </label>
        </div>

        <div className="rounded-2xl bg-[#fff1f4] p-4 text-sm leading-6 text-[#7b4b3f]">
          Exemplo: para leite condensado, coloque <b>5</b> embalagens, tipo <b>caixa</b> e conteúdo <b>395</b>. O sistema entende 5 caixas de 395g.
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-xs font-black uppercase tracking-wider text-[#9a6d5c]">Valor total pago
            <input name="totalPrice" type="number" step="0.01" placeholder="Ex: 32,50" className="mt-2 w-full rounded-2xl border border-[#ead8cf] px-4 py-3" />
          </label>
          <label className="block text-xs font-black uppercase tracking-wider text-[#9a6d5c]">Validade
            <input name="expiresAt" type="date" className="mt-2 w-full rounded-2xl border border-[#ead8cf] px-4 py-3" />
          </label>
        </div>
        <label className="block text-xs font-black uppercase tracking-wider text-[#9a6d5c]">Fornecedor / mercado
          <input name="supplier" placeholder="Ex: Assaí, Atacadão, mercado local..." className="mt-2 w-full rounded-2xl border border-[#ead8cf] px-4 py-3" />
        </label>
        <SubmitButton pendingText="Adicionando..." className="w-full rounded-2xl bg-[#5b382d] px-5 py-3 font-black text-white hover:bg-[#c98b9b]">Adicionar ao estoque</SubmitButton>
      </form>

      <form action={adjustStock} className="card-soft space-y-4 rounded-[2rem] p-6">
        <h2 className="text-xl font-black text-[#5b382d]">Ajuste manual</h2>
        <p className="text-sm text-[#8b6a5d]">Use para perda, uso fora de pedido, teste de receita ou correção de contagem.</p>
        <label className="block text-xs font-black uppercase tracking-wider text-[#9a6d5c]">Ingrediente
          <select name="ingredientId" required className="mt-2 w-full rounded-2xl border border-[#ead8cf] px-4 py-3">
            <option value="">Selecione o ingrediente</option>
            {allIngredients.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="block text-xs font-black uppercase tracking-wider text-[#9a6d5c]">Tipo de ajuste
            <select name="type" className="mt-2 w-full rounded-2xl border border-[#ead8cf] px-4 py-3"><option value="saida">Saída</option><option value="entrada">Entrada</option></select>
          </label>
          <label className="block text-xs font-black uppercase tracking-wider text-[#9a6d5c]">Quantas embalagens?
            <input name="packageCount" required type="number" step="0.01" placeholder="Ex: 1" className="mt-2 w-full rounded-2xl border border-[#ead8cf] px-4 py-3" />
          </label>
          <label className="block text-xs font-black uppercase tracking-wider text-[#9a6d5c]">Conteúdo por embalagem
            <input name="quantityPerPackage" required type="number" step="0.01" placeholder="Ex: 395" className="mt-2 w-full rounded-2xl border border-[#ead8cf] px-4 py-3" />
          </label>
        </div>
        <input name="notes" placeholder="Motivo do ajuste" className="w-full rounded-2xl border border-[#ead8cf] px-4 py-3" />
        <SubmitButton pendingText="Salvando ajuste..." className="w-full rounded-2xl bg-[#c98b9b] px-5 py-3 font-black text-white hover:bg-[#5b382d]">Salvar ajuste</SubmitButton>
      </form>
    </div>

    <div className="card-soft rounded-[2rem] p-5">
      <h2 className="mb-4 text-xl font-black text-[#5b382d]">Resumo por ingrediente</h2>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {allIngredients.map(i => <div key={i.id} className="rounded-3xl border border-[#ead8cf] bg-white/70 p-5">
          <p className="font-black text-[#5b382d]">{i.name}</p>
          <p className="mt-2 text-2xl font-black text-[#c98b9b]">{(totals.get(i.id) || 0).toLocaleString("pt-BR")} {i.unit}</p>
          <p className="text-xs text-[#9a6d5c]">Padrão: 1 {i.packageLabel || "unidade"} = {numberValue(i.purchaseQuantity).toLocaleString("pt-BR")} {i.unit}</p>
        </div>)}
      </div>
    </div>

    <div className="card-soft overflow-hidden rounded-[2rem]">
      <div className="border-b border-[#ead8cf] p-5"><h2 className="text-xl font-black text-[#5b382d]">Lotes em estoque</h2><p className="text-sm text-[#8b6a5d]">Cada compra fica registrada separadamente.</p></div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#f0ded6]">
          <thead className="bg-[#fff8ef]"><tr><th className="px-5 py-3 text-left text-xs font-black uppercase text-[#9a6d5c]">Ingrediente</th><th className="px-5 py-3 text-left text-xs font-black uppercase text-[#9a6d5c]">Compra</th><th className="px-5 py-3 text-left text-xs font-black uppercase text-[#9a6d5c]">Total disponível</th><th className="px-5 py-3 text-left text-xs font-black uppercase text-[#9a6d5c]">Validade</th><th className="px-5 py-3 text-right text-xs font-black uppercase text-[#9a6d5c]">Ações</th></tr></thead>
          <tbody className="divide-y divide-[#f0ded6]">
            {batches.map(b => <tr key={b.id} className="hover:bg-[#fff1f4]/60"><td className="px-5 py-4 font-black text-[#5b382d]">{b.ingredientName}<div className="text-xs font-normal text-[#9a6d5c]">{b.supplier || "sem fornecedor"}</div></td><td className="px-5 py-4 text-sm text-[#7b4b3f]">{numberValue(b.packageCount).toLocaleString("pt-BR")} {b.packageLabel} de {numberValue(b.quantityPerPackage).toLocaleString("pt-BR")}{b.unit}</td><td className="px-5 py-4 font-black text-[#c98b9b]">{numberValue(b.totalQuantity).toLocaleString("pt-BR")} {b.unit}</td><td className="px-5 py-4 text-sm text-[#8b6a5d]">{b.expiresAt ? shortDate(b.expiresAt) : "—"}</td><td className="px-5 py-4 text-right"><form action={async () => { "use server"; await deleteStockBatch(b.id); }}><SubmitButton pendingText="" className="rounded-xl p-2 text-red-400 hover:bg-red-50"><Trash2 className="h-4 w-4" /></SubmitButton></form></td></tr>)}
            {batches.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-[#9a6d5c]">Nenhuma entrada de estoque lançada ainda.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  </div>;
}
