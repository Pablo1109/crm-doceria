import { z } from "zod";
import { db } from "@/db";
import { orders, orderItems, calendarEvents, financialTransactions } from "@/db/schema";
import { revalidatePath } from "next/cache";

const createOrderSchema = z.object({
  customerName: z.string().min(1, "Nome do cliente é obrigatório"),
  customerPhone: z.string().optional(),
  deliveryDate: z.string().min(1, "Data de entrega é obrigatória"), // YYYY-MM-DD
  deliveryTime: z.string().optional(), // HH:MM
  totalAmount: z.number(),
  notes: z.string().optional(),
  items: z.array(z.object({
    recipeId: z.number(),
    quantity: z.number(),
    unitPrice: z.number()
  })),
  signal: z.number().optional() // sinal pago na reserva
});

export const createOrderAction = {
  name: "create_order",
  description: "Cadastra uma nova encomenda de doces, itens vinculados, agendamento automático no calendário e movimentação financeira de sinal se pago.",
  inputSchema: createOrderSchema,
  execute: async (input: z.infer<typeof createOrderSchema>) => {
    // 1. Montar observações do pedido
    const signalPaid = input.signal || 0;
    const fullNotes = [
      signalPaid > 0 ? `Sinal pago: R$ ${signalPaid.toFixed(2)}` : null,
      input.notes
    ].filter(Boolean).join("\n");

    // 2. Inserir pedido no banco
    const [newOrder] = await db.insert(orders).values({
      customerName: input.customerName,
      customerPhone: input.customerPhone || null,
      deliveryDate: input.deliveryDate,
      deliveryTime: input.deliveryTime || null,
      notes: fullNotes,
      status: "pending",
      settled: false,
      totalAmount: input.totalAmount.toFixed(2)
    }).returning();

    // 3. Inserir itens vinculados ao pedido
    for (const item of input.items) {
      await db.insert(orderItems).values({
        orderId: newOrder.id,
        recipeId: item.recipeId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2)
      });
    }

    // 4. Agendar compromisso de entrega no calendário de forma automática
    await db.insert(calendarEvents).values({
      title: `Entrega: ${input.customerName}`,
      description: `Pedido #${String(newOrder.id).padStart(4, "0")} - Valor total: R$ ${input.totalAmount.toFixed(2)}`,
      eventDate: input.deliveryDate,
      eventTime: input.deliveryTime || null,
      type: "task"
    });

    // 5. Se houver sinal pago, lançar movimentação de entrada no cofre físico de imediato
    if (signalPaid > 0) {
      await db.insert(financialTransactions).values({
        type: "income",
        amount: signalPaid.toFixed(2),
        description: `Sinal da Encomenda #${String(newOrder.id).padStart(4, "0")} - ${input.customerName}`,
        date: new Date().toISOString().split("T")[0],
        category: "pedido",
        referenceId: newOrder.id
      });
    }

    revalidatePath("/pedidos");
    revalidatePath("/calendario");
    revalidatePath("/financeiro");
    revalidatePath("/");

    return {
      success: true,
      message: `Encomenda #${String(newOrder.id).padStart(4, "0")} criada para ${input.customerName}!
- Data: ${input.deliveryDate} às ${input.deliveryTime || "não informada"}
- Total: R$ ${input.totalAmount.toFixed(2)}
- Sinal Recebido: R$ ${signalPaid.toFixed(2)}
- Compromisso agendado no calendário automaticamente.`,
      orderId: newOrder.id,
      order: newOrder
    };
  }
};


