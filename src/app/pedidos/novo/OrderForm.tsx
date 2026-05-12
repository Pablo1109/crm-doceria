"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { createOrder } from "@/app/pedidos/actions";

type Recipe = { id: number; name: string; suggestedPrice: number };
type Item = { recipeId: number; quantity: number; unitPrice: number };

export default function OrderForm({ recipes }: { recipes: Recipe[] }) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [saving, setSaving] = useState(false);

  function addItem() {
    setItems([...items, { recipeId: 0, quantity: 1, unitPrice: 0 }]);
  }

  function updateItem(index: number, field: keyof Item, value: number) {
    setItems(items.map((it, i) => {
      if (i !== index) return it;
      const up = { ...it, [field]: value };
      if (field === "recipeId") {
        const r = recipes.find(x => x.id === value);
        up.unitPrice = r ? r.suggestedPrice : 0;
      }
      return up;
    }));
  }

  const validItems = items.filter(i => i.recipeId > 0 && i.quantity > 0);
  const total = validItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const id = await createOrder(new FormData(e.currentTarget), validItems);
    router.push(`/pedidos/${id}?success=pedido`);
  }

  return <div className="mx-auto max-w-5xl space-y-6">
    <Link href="/pedidos" className="inline-flex items-center text-sm font-black text-slate-500 hover:text-rose-600"><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Link>
    <div><p className="text-sm font-black uppercase tracking-widest text-rose-400">Nova encomenda</p><h1 className="text-3xl font-black text-slate-950">Cadastrar pedido</h1><p className="text-slate-500">Clique em Adicionar produto, escolha a receita/produto e informe quantidade e valor.</p></div>
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-[2rem] bg-white p-6 shadow-sm"><h2 className="text-xl font-black">Cliente</h2><input name="customerName" required placeholder="Nome do cliente" className="w-full rounded-2xl border border-slate-200 px-4 py-3" /><input name="customerPhone" placeholder="WhatsApp / telefone" className="w-full rounded-2xl border border-slate-200 px-4 py-3" /><div className="grid grid-cols-2 gap-3"><input name="deliveryDate" required type="date" className="rounded-2xl border border-slate-200 px-4 py-3" /><input name="deliveryTime" type="time" className="rounded-2xl border border-slate-200 px-4 py-3" /></div><select name="deliveryType" className="w-full rounded-2xl border border-slate-200 px-4 py-3"><option value="retirada">Retirada</option><option value="entrega">Entrega</option></select><input name="signal" type="number" step="0.01" placeholder="Sinal pago" className="w-full rounded-2xl border border-slate-200 px-4 py-3" /></div>
        <div className="rounded-[2rem] bg-white p-6 shadow-sm"><h2 className="mb-4 text-xl font-black">Observações</h2><textarea name="notes" rows={12} placeholder="Tema, cores, recheio, endereço, detalhes combinados..." className="w-full rounded-2xl border border-slate-200 px-4 py-3" /></div>
      </div>
      <div className="rounded-[2rem] bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h2 className="text-xl font-black">Produtos do pedido</h2><p className="text-sm text-slate-500">Produto vem das receitas cadastradas. Cadastre uma receita se a lista estiver vazia.</p></div><button type="button" onClick={addItem} className="inline-flex items-center justify-center rounded-2xl bg-rose-50 px-4 py-2 text-sm font-black text-rose-600 hover:bg-rose-100"><Plus className="mr-2 h-4 w-4" />Adicionar produto</button></div>
        <div className="space-y-3">{items.map((item, index) => <div key={index} className="grid gap-3 rounded-3xl border border-slate-100 p-4 md:grid-cols-[1fr_100px_150px_120px_40px] md:items-end"><label className="text-xs font-black uppercase text-slate-400">Produto<select value={item.recipeId} onChange={e => updateItem(index, "recipeId", Number(e.target.value))} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm normal-case text-slate-900"><option value={0}>Escolha um produto</option>{recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label><label className="text-xs font-black uppercase text-slate-400">Qtd<input type="number" min="1" value={item.quantity} onChange={e => updateItem(index, "quantity", Number(e.target.value))} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900" /></label><label className="text-xs font-black uppercase text-slate-400">Preço unit.<input type="number" step="0.01" value={item.unitPrice} onChange={e => updateItem(index, "unitPrice", Number(e.target.value))} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-slate-900" /></label><div><p className="text-xs font-black uppercase text-slate-400">Subtotal</p><p className="mt-3 font-black text-rose-600">R$ {(item.quantity * item.unitPrice).toFixed(2)}</p></div><button type="button" onClick={() => setItems(items.filter((_, i) => i !== index))} className="rounded-xl p-2 text-red-400 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div>)}{items.length === 0 && <p className="rounded-3xl bg-slate-50 p-8 text-center text-slate-400">Clique em “Adicionar produto” para escolher o produto desta encomenda.</p>}</div>
        <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 md:flex-row md:items-center md:justify-between"><p className="text-3xl font-black text-slate-950">Total: <span className="text-rose-600">R$ {total.toFixed(2)}</span></p><button disabled={validItems.length === 0 || saving} className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-6 py-3 font-black text-white hover:bg-rose-600 disabled:opacity-50"><Save className="mr-2 h-5 w-5" />{saving ? "Salvando..." : "Salvar pedido"}</button></div>
      </div>
    </form>
  </div>;
}
