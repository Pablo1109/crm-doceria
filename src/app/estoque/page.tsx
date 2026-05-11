import { db } from "@/db";
import { ingredients, stockBatches } from "@/db/schema";
import { money, numberValue, shortDate } from "@/lib/format";
import { asc, eq } from "drizzle-orm";
import { Boxes, PackageCheck, Trash2 } from "lucide-react";
import { addStock, adjustStock, deleteStockBatch } from "@/app/ingredientes/actions";

export default async function EstoquePage() {
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
    <div>
      <p className="text-sm font-black uppercase tracking-widest text-rose-400">Controle físico</p>
      <h1 className="text-3xl font-black text-slate-950">Estoque</h1>
      <p className="text-slate-500">Aqui você lança quantas embalagens comprou. Ex: 5 caixas de 395g de leite condensado.</p>
    </div>

    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-[2rem] bg-white p-6 shadow-sm"><Boxes className="mb-4 h-6 w-6 text-rose-500" /><p className="text-xs font-black uppercase tracking-widest text-slate-400">Ingredientes com estoque</p><p className="mt-2 text-3xl font-black">{totals.size}</p></div>
      <div className="rounded-[2rem] bg-white p-6 shadow-sm"><PackageCheck className="mb-4 h-6 w-6 text-emerald-500" /><p className="text-xs font-black uppercase tracking-widest text-slate-400">Valor aproximado em estoque</p><p className="mt-2 text-3xl font-black">{money(totalValue)}</p></div>
    </div>

    <div className="grid gap-6 lg:grid-cols-2">
      <form action={addStock} className="space-y-4 rounded-[2rem] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black">Entrada de compra</h2>
        <select name="ingredientId" required className="w-full rounded-2xl border border-slate-200 px-4 py-3">
          <option value="">Selecione o ingrediente</option>
          {allIngredients.map(i => <option key={i.id} value={i.id}>{i.name} — padrão: {i.packageLabel || "unidade"} de {numberValue(i.purchaseQuantity).toLocaleString("pt-BR")}{i.unit}</option>)}
        </select>
        <div className="grid grid-cols-3 gap-3">
          <input name="packageCount" required type="number" step="0.01" placeholder="Qtd embalagens" className="rounded-2xl border border-slate-200 px-4 py-3" />
          <input name="packageLabel" type="text" placeholder="caixa/lata/pacote" className="rounded-2xl border border-slate-200 px-4 py-3" />
          <input name="quantityPerPackage" required type="number" step="0.01" placeholder="Qtd por embalagem" className="rounded-2xl border border-slate-200 px-4 py-3" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input name="totalPrice" type="number" step="0.01" placeholder="Valor total pago" className="rounded-2xl border border-slate-200 px-4 py-3" />
          <input name="expiresAt" type="date" className="rounded-2xl border border-slate-200 px-4 py-3" />
        </div>
        <input name="supplier" placeholder="Fornecedor / mercado" className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
        <button className="w-full rounded-2xl bg-slate-950 px-5 py-3 font-black text-white hover:bg-rose-600">Adicionar ao estoque</button>
      </form>

      <form action={adjustStock} className="space-y-4 rounded-[2rem] bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black">Ajuste manual</h2>
        <p className="text-sm text-slate-500">Use para perda, uso fora de pedido ou correção de contagem.</p>
        <select name="ingredientId" required className="w-full rounded-2xl border border-slate-200 px-4 py-3">
          <option value="">Selecione o ingrediente</option>
          {allIngredients.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
        <div className="grid grid-cols-3 gap-3">
          <select name="type" className="rounded-2xl border border-slate-200 px-4 py-3"><option value="saida">Saída</option><option value="entrada">Entrada</option></select>
          <input name="packageCount" required type="number" step="0.01" placeholder="Qtd emb." className="rounded-2xl border border-slate-200 px-4 py-3" />
          <input name="quantityPerPackage" required type="number" step="0.01" placeholder="Qtd por emb." className="rounded-2xl border border-slate-200 px-4 py-3" />
        </div>
        <input name="notes" placeholder="Motivo do ajuste" className="w-full rounded-2xl border border-slate-200 px-4 py-3" />
        <button className="w-full rounded-2xl bg-rose-500 px-5 py-3 font-black text-white hover:bg-rose-600">Salvar ajuste</button>
      </form>
    </div>

    <div className="rounded-[2rem] bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-xl font-black text-slate-950">Resumo por ingrediente</h2>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {allIngredients.map(i => <div key={i.id} className="rounded-3xl border border-slate-100 p-5">
          <p className="font-black text-slate-950">{i.name}</p>
          <p className="mt-2 text-2xl font-black text-rose-600">{(totals.get(i.id) || 0).toLocaleString("pt-BR")} {i.unit}</p>
          <p className="text-xs text-slate-400">Padrão: 1 {i.packageLabel || "unidade"} = {numberValue(i.purchaseQuantity).toLocaleString("pt-BR")} {i.unit}</p>
        </div>)}
      </div>
    </div>

    <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5"><h2 className="text-xl font-black">Lotes em estoque</h2><p className="text-sm text-slate-500">Cada compra fica registrada separadamente.</p></div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50"><tr><th className="px-5 py-3 text-left text-xs font-black uppercase text-slate-400">Ingrediente</th><th className="px-5 py-3 text-left text-xs font-black uppercase text-slate-400">Embalagens</th><th className="px-5 py-3 text-left text-xs font-black uppercase text-slate-400">Total</th><th className="px-5 py-3 text-left text-xs font-black uppercase text-slate-400">Validade</th><th className="px-5 py-3 text-right text-xs font-black uppercase text-slate-400">Ações</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {batches.map(b => <tr key={b.id} className="hover:bg-rose-50/40"><td className="px-5 py-4 font-black text-slate-900">{b.ingredientName}<div className="text-xs font-normal text-slate-400">{b.supplier || "sem fornecedor"}</div></td><td className="px-5 py-4 text-sm text-slate-600">{numberValue(b.packageCount).toLocaleString("pt-BR")} {b.packageLabel} de {numberValue(b.quantityPerPackage).toLocaleString("pt-BR")}{b.unit}</td><td className="px-5 py-4 font-black text-rose-600">{numberValue(b.totalQuantity).toLocaleString("pt-BR")} {b.unit}</td><td className="px-5 py-4 text-sm text-slate-500">{b.expiresAt ? shortDate(b.expiresAt) : "—"}</td><td className="px-5 py-4 text-right"><form action={async () => { "use server"; await deleteStockBatch(b.id); }}><button className="rounded-xl p-2 text-red-400 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></form></td></tr>)}
            {batches.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">Nenhuma entrada de estoque lançada ainda.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  </div>;
}
