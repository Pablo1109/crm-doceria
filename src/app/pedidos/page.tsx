import { db } from "@/db";
import { orders } from "@/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { Plus, Calendar, User, Phone, Tag } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { updateOrderStatus, deleteOrder } from "./actions";
import StatusSelect from "./StatusSelect";

export const dynamic = "force-dynamic";

export default async function PedidosPage() {
  const allOrders = await db.select().from(orders).orderBy(desc(orders.deliveryDate));

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    confirmed: "bg-blue-100 text-blue-800 border-blue-200",
    delivered: "bg-green-100 text-green-800 border-green-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pendente",
    confirmed: "Confirmado",
    delivered: "Entregue",
    cancelled: "Cancelado",
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Pedidos</h1>
          <p className="text-gray-500">Acompanhe suas encomendas e prazos</p>
        </div>
        <Link 
          href="/pedidos/novo" 
          className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors flex items-center shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Pedido
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente / Data</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {allOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center mb-1">
                    <User className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-sm font-bold text-gray-900">{order.customerName}</span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="w-3 h-3 mr-2" />
                    {format(new Date(order.deliveryDate), "PPP", { locale: ptBR })}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold border ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-pink-600 whitespace-nowrap">
                  R$ {parseFloat(order.totalAmount || "0").toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap flex items-center justify-end">
                  <Link 
                    href={`/pedidos/${order.id}`}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded font-bold transition-colors"
                  >
                    Ver / Orçamento
                  </Link>
                  <StatusSelect id={order.id} currentStatus={order.status} />
                  <form className="inline" action={async () => { "use server"; await deleteOrder(order.id); }}>
                    <button type="submit" className="text-red-400 hover:text-red-600 transition-colors p-1">
                      Excluir
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {allOrders.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic">
                  Nenhum pedido encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
