import { db } from "@/db";
import { orders, orderItems, recipes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ArrowLeft, Printer, MessageCircle, Calendar, User, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function PedidoDetailPage({ params }: { params: { id: string } }) {
  const orderId = parseInt(params.id);

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });

  if (!order) notFound();

  const items = await db.select({
    quantity: orderItems.quantity,
    unitPrice: orderItems.unitPrice,
    recipeName: recipes.name,
  })
  .from(orderItems)
  .innerJoin(recipes, eq(orderItems.recipeId, recipes.id))
  .where(eq(orderItems.orderId, orderId));

  const whatsappMessage = encodeURIComponent(
    `Olá ${order.customerName}! Aqui está o orçamento do seu pedido:\n\n` +
    items.map(i => `- ${i.quantity}x ${i.recipeName}: R$ ${(parseFloat(i.unitPrice) * i.quantity).toFixed(2)}`).join('\n') +
    `\n\n*Total: R$ ${parseFloat(order.totalAmount || "0").toFixed(2)}*\nData de entrega: ${format(new Date(order.deliveryDate), "dd/MM/yyyy")}`
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex justify-between items-center print:hidden">
        <Link href="/pedidos" className="flex items-center text-gray-500 hover:text-pink-600 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para pedidos
        </Link>
        <div className="flex gap-2">
          <button 
            onClick={() => window.print()} 
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center text-sm font-bold"
          >
            <Printer className="w-4 h-4 mr-2" /> Imprimir
          </button>
          <a 
            href={`https://wa.me/${order.customerPhone?.replace(/\D/g, '')}?text=${whatsappMessage}`}
            target="_blank"
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center text-sm font-bold shadow-sm"
          >
            <MessageCircle className="w-4 h-4 mr-2" /> Enviar WhatsApp
          </a>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 text-right opacity-10 pointer-events-none">
          <ShoppingBag className="w-32 h-32 text-pink-600" />
        </div>

        <div className="border-b pb-8 mb-8">
          <h1 className="text-sm font-black text-pink-600 uppercase tracking-widest mb-1">Orçamento / Pedido</h1>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-3xl font-bold text-gray-900">#{order.id.toString().padStart(4, '0')}</p>
              <p className="text-gray-500">Emitido em {format(new Date(order.createdAt), "dd 'de' MMMM", { locale: ptBR })}</p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-bold uppercase border border-pink-200">
                {order.status === 'pending' ? 'Pendente' : order.status}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-12">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center">
              <User className="w-3 h-3 mr-1" /> Cliente
            </h3>
            <p className="font-bold text-lg text-gray-800">{order.customerName}</p>
            <p className="text-gray-600">{order.customerPhone || "Sem telefone"}</p>
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center">
              <Calendar className="w-3 h-3 mr-1" /> Entrega Prevista
            </h3>
            <p className="font-bold text-lg text-gray-800">
              {format(new Date(order.deliveryDate), "PPP", { locale: ptBR })}
            </p>
            <p className="text-pink-600 text-sm font-medium">Lembrete: Faltam X dias</p>
          </div>
        </div>

        <div className="mb-12">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-4">Itens do Pedido</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-xs text-gray-400">
                <th className="pb-3 font-bold uppercase">Produto</th>
                <th className="pb-3 font-bold uppercase text-center">Qtd</th>
                <th className="pb-3 font-bold uppercase text-right">Preço</th>
                <th className="pb-3 font-bold uppercase text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item, i) => (
                <tr key={i}>
                  <td className="py-4 font-bold text-gray-800">{item.recipeName}</td>
                  <td className="py-4 text-center text-gray-600">{item.quantity}</td>
                  <td className="py-4 text-right text-gray-600">R$ {parseFloat(item.unitPrice).toFixed(2)}</td>
                  <td className="py-4 text-right font-bold text-gray-900">
                    R$ {(item.quantity * parseFloat(item.unitPrice)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {order.notes && (
          <div className="bg-gray-50 p-4 rounded-xl mb-12 border border-dashed border-gray-200">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Observações Adicionais</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.notes}</p>
          </div>
        )}

        <div className="border-t pt-8 flex justify-end">
          <div className="w-64 space-y-3">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal:</span>
              <span>R$ {parseFloat(order.totalAmount || "0").toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-2xl font-black text-gray-900 pt-2 border-t">
              <span>Total:</span>
              <span className="text-pink-600">R$ {parseFloat(order.totalAmount || "0").toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-gray-400 text-xs print:mt-10">
        Gerado pelo Doceria CRM - Organização e Doçura
      </div>
    </div>
  );
}
