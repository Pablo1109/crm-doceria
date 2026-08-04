import { db } from "@/db";
import { ingredients } from "@/db/schema";
import { eq } from "drizzle-orm";
import { editIngredient } from "../../actions";
import { Boxes, Plus, Trash2, Edit } from "lucide-react";
import Link from "next/link";
import { asc } from "drizzle-orm";
import { money, numberValue } from "@/lib/format";
import SubmitButton from "@/components/SubmitButton";
import Toast from "@/components/Toast";

export const dynamic = "force-dynamic";

export default async function EditIngredientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ingredientId = Number(id);
  const [ingredient] = await db.select().from(ingredients).where(eq(ingredients.id, ingredientId));
  if (!ingredient) {
    return <div className="p-8 text-red-600">Ingrediente não encontrado.</div>;
  }

  return (
    <div className="space-y-8">
      <Toast type={undefined} />
      <div>
        <p className="text-sm font-black uppercase tracking-widest text-[#c98b9b]">Editar ingrediente</p>
        <h1 className="text-3xl font-black text-[#5b382d]">{ingredient.name}</h1>
        <p className="text-[#8b6a5d]">Altere as informações deste ingrediente.</p>
      </div>
      <form action={editIngredient} className="space-y-4">
        <input type="hidden" name="id" value={ingredient.id} />
        <label className="block text-xs font-black uppercase tracking-wider text-[#9a6d5c]">
          Nome do ingrediente
          <input name="name" required defaultValue={ingredient.name} className="mt-2 w-full rounded-2xl border border-[#ead8cf] px-4 py-3" placeholder="Ex: Leite condensado" />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-xs font-black uppercase tracking-wider text-[#9a6d5c]">
            Embalagem padrão
            <select name="packageLabel" defaultValue={ingredient.packageLabel ?? 'unidade'} className="mt-2 w-full rounded-2xl border border-[#ead8cf] px-4 py-3">
              <option value="caixa">Caixa</option>
              <option value="lata">Lata</option>
              <option value="pacote">Pacote</option>
              <option value="pote">Pote</option>
              <option value="saco">Saco</option>
              <option value="unidade">Unidade</option>
            </select>
          </label>
          <label className="block text-xs font-black uppercase tracking-wider text-[#9a6d5c]">
            Medida usada nas receitas
            <select name="unit" defaultValue={ingredient.unit ?? 'g'} className="mt-2 w-full rounded-2xl border border-[#ead8cf] px-4 py-3">
              <option value="g">Gramas (g)</option>
              <option value="ml">Mililitros (ml)</option>
              <option value="un">Unidade (un)</option>
            </select>
          </label>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-xs font-black uppercase tracking-wider text-[#9a6d5c]">
            Conteúdo da embalagem
            <input name="purchaseQuantity" type="number" step="0.01" defaultValue={ingredient.purchaseQuantity ?? ''} className="mt-2 w-full rounded-2xl border border-[#ead8cf] px-4 py-3" placeholder="Ex: 395" />
          </label>
          <label className="block text-xs font-black uppercase tracking-wider text-[#9a6d5c]">
            Preço médio da embalagem
            <input name="purchasePrice" type="number" step="0.01" defaultValue={ingredient.purchasePrice ?? ''} className="mt-2 w-full rounded-2xl border border-[#ead8cf] px-4 py-3" placeholder="Ex: 6.50" />
          </label>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-xs font-black uppercase tracking-wider text-[#9a6d5c]">
            Estoque mínimo para alerta (em embalagens)
            <input name="minimumPackageCount" type="number" step="0.01" defaultValue={ingredient.minimumPackageCount ?? ''} className="mt-2 w-full rounded-2xl border border-[#ead8cf] px-4 py-3" placeholder="Ex: 2 (alerta se restarem menos de 2 caixas/latas)" />
          </label>
          <label className="block text-xs font-black uppercase tracking-wider text-[#9a6d5c]">
            Equivalente em {ingredient.unit || "g/ml"} (opcional)
            <input name="minimumStock" type="number" step="0.01" defaultValue={ingredient.minimumStock ?? ''} className="mt-2 w-full rounded-2xl border border-[#ead8cf] px-4 py-3" placeholder="Calculado automaticamente" />
          </label>
        </div>
        <div className="rounded-2xl bg-[#fff1f4] p-4 text-sm leading-6 text-[#7b4b3f]">
          Exemplo: Leite condensado → embalagem caixa → conteúdo 395g → alerta ao atingir menos de <b>2</b> caixas no estoque.
        </div>
        <SubmitButton pendingText="Atualizando..." className="w-full rounded-2xl bg-[#5b382d] px-4 py-3 font-black text-white hover:bg-[#c98b9b]">
          Atualizar ingrediente
        </SubmitButton>
      </form>
      <div className="flex gap-2">
        <Link href="/ingredientes" className="text-blue-600 hover:underline">← Voltar à lista</Link>
      </div>
    </div>
  );
}
