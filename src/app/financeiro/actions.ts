"use server";
import { db } from "@/db";
import { financialTransactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function addTransaction(formData: FormData) {
  const type = String(formData.get("type") || "expense"); // 'expense' or 'withdrawal'
  const amount = Number(String(formData.get("amount") || "0").replace(",", "."));
  const description = String(formData.get("description") || "").trim();
  const date = String(formData.get("date") || "");
  const category = String(formData.get("category") || "outro");

  if (amount <= 0 || !description || !date) return;

  await db.insert(financialTransactions).values({
    type,
    amount: amount.toFixed(2),
    description,
    date,
    category,
  });

  revalidatePath("/financeiro");
  revalidatePath("/");
  redirect("/financeiro?success=transacao");
}

export async function deleteTransaction(id: number) {
  await db.delete(financialTransactions).where(eq(financialTransactions.id, id));
  revalidatePath("/financeiro");
  revalidatePath("/");
  redirect("/financeiro?success=excluido");
}

export async function updateTransaction(id: number, formData: FormData) {
  const type = String(formData.get("type") || "expense");
  const amount = Number(String(formData.get("amount") || "0").replace(",", "."));
  const description = String(formData.get("description") || "").trim();
  const date = String(formData.get("date") || "");
  const category = String(formData.get("category") || "outro");

  if (amount <= 0 || !description || !date) return;

  await db.update(financialTransactions)
    .set({ type, amount: amount.toFixed(2), description, date, category })
    .where(eq(financialTransactions.id, id));

  revalidatePath("/financeiro");
  revalidatePath("/");
  redirect("/financeiro?success=editado");
}
