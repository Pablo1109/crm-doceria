import { db } from "@/db";
import { orders, orderItems, recipes, calendarEvents } from "@/db/schema";
import { asc, desc } from "drizzle-orm";
import CalendarioClient from "./CalendarioClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Calendário de Encomendas & Parcerias | La Délice",
};

export default async function CalendarioPage() {
  // 1. Buscar todos os pedidos (exceto cancelados) para o calendário
  const allOrders = await db
    .select({
      id: orders.id,
      customerName: orders.customerName,
      customerPhone: orders.customerPhone,
      deliveryDate: orders.deliveryDate,
      deliveryTime: orders.deliveryTime,
      partyDate: orders.partyDate,
      partyTime: orders.partyTime,
      status: orders.status,
      totalAmount: orders.totalAmount,
      notes: orders.notes,
    })
    .from(orders)
    .orderBy(desc(orders.deliveryDate)); // ordenado para consistência

  // 2. Buscar itens e nomes das receitas para somar as quantidades de docinhos de cada dia
  const items = await db
    .select({
      orderId: orderItems.orderId,
      recipeName: recipes.name,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .innerJoin(recipes, eq(orderItems.recipeId, recipes.id))
    .catch(() => []); // Prevenir caso tabela receitas esteja vazia

  // 3. Buscar todos os eventos customizados e tarefas de parceria
  const customEvents = await db
    .select()
    .from(calendarEvents)
    .orderBy(asc(calendarEvents.eventDate), asc(calendarEvents.eventTime));

  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-black uppercase tracking-widest text-[#c98b9b]">Produção e Planejamento</p>
        <h1 className="text-3xl font-black text-[#5b382d]">Calendário de Produção</h1>
        <p className="text-[#8b6a5d] text-sm mt-1">
          Acompanhe suas entregas do mês, horários das festas e tarefas de parcerias. Selecione um dia para ver a lista de produção total.
        </p>
      </div>

      <CalendarioClient 
        orders={allOrders} 
        orderItems={items} 
        customEvents={customEvents} 
      />
    </div>
  );
}

// Pequena correção de escopo: importar o operador 'eq' se necessário, mas podemos usar drizzle ORM direto.
// Importando o eq do drizzle-orm para o join funcionar
import { eq } from "drizzle-orm";
