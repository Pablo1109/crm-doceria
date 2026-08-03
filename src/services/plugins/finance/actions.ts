import { z } from "zod";
import { actionRegistry } from "../../ai/actionRegistry";
import { db } from "@/db";
import { financialTransactions } from "@/db/schema";
import { revalidatePath } from "next/cache";

const registerManualTransactionSchema = z.object({
  type: z.enum(["expense", "withdrawal"]),
  category: z.string().min(1, "Categoria é obrigatória"),
  amount: z.number(),
  description: z.string().min(1, "Descrição é obrigatória"),
  date: z.string().min(1, "Data é obrigatória")
});

export const registerManualTransactionAction = {
  name: "register_manual_transaction",
  description: "Registra uma movimentação manual (saída de despesa ou retirada de pró-labore) diretamente no cofre físico.",
  inputSchema: registerManualTransactionSchema,
  execute: async (input: z.infer<typeof registerManualTransactionSchema>) => {
    const [tx] = await db.insert(financialTransactions).values({
      type: input.type,
      amount: input.amount.toFixed(2),
      description: input.description,
      date: input.date,
      category: input.category
    }).returning();

    revalidatePath("/financeiro");
    revalidatePath("/");
    return {
      success: true,
      message: `Movimentação de ${input.type === "expense" ? "Despesa" : "Retirada"} no valor de R$ ${input.amount.toFixed(2)} cadastrada com sucesso no cofre!`,
      transaction: tx
    };
  }
};

const consultFinanceSchema = z.object({
  period: z.enum(["q1", "q2", "month"]).default("month")
});

export const consultFinanceAction = {
  name: "consult_finance",
  description: "Consulta o balanço do cofre, faturamento e despesas do caixa.",
  inputSchema: consultFinanceSchema,
  execute: async (input: z.infer<typeof consultFinanceSchema>) => {
    const transactions = await db.select().from(financialTransactions).catch(() => []);

    const income = transactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);
      
    const expense = transactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);
      
    const withdrawal = transactions
      .filter(t => t.type === "withdrawal")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const safeBalance = income - expense - withdrawal;

    return {
      success: true,
      data: {
        totalIncome: income,
        totalExpense: expense,
        totalWithdrawal: withdrawal,
        safeBalance
      },
      message: `Balanço Geral do Cofre:
- Total Recebido (Entradas): R$ ${income.toFixed(2)}
- Despesas Totais (Saídas): R$ ${expense.toFixed(2)}
- Retiradas (Pró-labore): R$ ${withdrawal.toFixed(2)}
- Saldo Físico Real no Cofre: R$ ${safeBalance.toFixed(2)}`
    };
  }
};

actionRegistry.register(registerManualTransactionAction);
actionRegistry.register(consultFinanceAction);
