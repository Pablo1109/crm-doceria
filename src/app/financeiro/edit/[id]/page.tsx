import { db } from "@/db";
import { financialTransactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { updateTransaction } from "../../actions";
import SubmitButton from "@/components/SubmitButton";
import { Edit } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EditTransactionPage({ params }: { params: { id: string } }) {
  const transactionId = Number(params.id);
  const transaction = await db.select().from(financialTransactions).where(eq(financialTransactions.id, transactionId)).then(rows => rows[0]);

  if (!transaction) {
    return <div className="p-6 text-center text-red-600">Transação não encontrada.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-black text-[#5b382d]">Editar Movimentação</h1>
      <form
        action={async (formData: FormData) => {
          "use server";
          await updateTransaction(transactionId, formData);
        }}
        className="space-y-4"
      >
        <label className="block text-xs font-black uppercase text-[#9a6d5c]">Tipo</label>
        <select name="type" defaultValue={transaction.type} className="mt-1.5 w-full rounded-xl border border-[#ead8cf] bg-white px-3 py-2.5 text-sm cursor-pointer">
          <option value="income">Entrada (Receita)</option>
          <option value="expense">Despesa (Saída)</option>
          <option value="withdrawal">Retirada (Pró‑labore)</option>
        </select>

        <label className="block text-xs font-black uppercase text-[#9a6d5c]">Categoria</label>
        <select name="category" defaultValue={transaction.category} className="mt-1.5 w-full rounded-xl border border-[#ead8cf] bg-white px-3 py-2.5 text-sm cursor-pointer">
          <option value="despesa-fixa">Custo Fixo (Gás, Energia, Aluguel)</option>
          <option value="embalagem">Embalagens</option>
          <option value="pro-labore">Retirada / Pró‑labore</option>
          <option value="outro">Outro gasto administrativo</option>
        </select>

        <label className="block text-xs font-black uppercase text-[#9a6d5c]">Valor (R$)</label>
        <input name="amount" type="number" step="0.01" defaultValue={transaction.amount} required className="mt-1.5 w-full rounded-xl border border-[#ead8cf] bg-white px-3 py-2.5 text-sm" />

        <label className="block text-xs font-black uppercase text-[#9a6d5c]">Descrição / Motivo</label>
        <input name="description" defaultValue={transaction.description} required className="mt-1.5 w-full rounded-xl border border-[#ead8cf] bg-white px-3 py-2.5 text-sm" />

        <label className="block text-xs font-black uppercase text-[#9a6d5c]">Data</label>
        <input name="date" type="date" defaultValue={transaction.date} required className="mt-1.5 w-full rounded-xl border border-[#ead8cf] bg-white px-3 py-2.5 text-sm" />

        <SubmitButton pendingText="Salvando..." className="w-full rounded-xl bg-[#5b382d] py-3 text-sm font-black text-white hover:bg-[#c98b9b]">
          Atualizar Movimentação
        </SubmitButton>
      </form>
      <Link href="/financeiro" className="inline-flex items-center gap-1 text-sm text-[#5b382d] hover:underline">
        <Edit className="h-4 w-4" /> Voltar ao Financeiro
      </Link>
    </div>
  );
}
