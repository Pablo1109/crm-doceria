import { db } from "@/db";
import { orders } from "@/db/schema";
import { sql, gte, and, desc } from "drizzle-orm";
import { ShoppingBag, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { format, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

export default async function DashboardPage() {
  const today = new Date().toISOString().split('T')[0];
  
  const pendingOrders = await db.select()
    .from(orders)
    .where(and(sql`${orders.status} = 'pending'`, gte(orders.deliveryDate, today)))
    .orderBy(orders.deliveryDate);

  const stats = await db.select({
    count: sql<number>`count(*)`,
    total: sql<number>`sum(${orders.totalAmount})`
  }).from(orders).where(gte(orders.createdAt, startOfMonth(new Date())));

  const monthlyRevenue = stats[0]?.total || 0;
  const monthlyCount = stats[0]?.count || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Boas-vindas! 🍬</h1>
        <p className="text-gray-500">Aqui está o resumo do seu negócio de doces.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border flex items-center space-x-4">
          <div className="bg-pink-100 p-3 rounded-lg">
            <TrendingUp className="w-6 h-6 text-pink-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Faturamento (Mês)</p>
            <p className="text-2xl font-bold text-gray-800">R$ {Number(monthlyRevenue).toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border flex items-center space-x-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <ShoppingBag className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Pedidos (Mês)</p>
            <p className="text-2xl font-bold text-gray-800">{monthlyCount}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border flex items-center space-x-4">
          <div className="bg-yellow-100 p-3 rounded-lg">
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Aguardando Entrega</p>
            <p className="text-2xl font-bold text-gray-800">{pendingOrders.length}</p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Deliveries */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-gray-700 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-pink-500" />
              Próximas Entregas
            </h2>
            <Link href="/pedidos" className="text-xs text-pink-600 font-bold hover:underline">Ver todos</Link>
          </div>
          <div className="divide-y">
            {pendingOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-800">{order.customerName}</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(order.deliveryDate), "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-pink-600">R$ {parseFloat(order.totalAmount || "0").toFixed(2)}</p>
                  <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-bold">Pendente</span>
                </div>
              </div>
            ))}
            {pendingOrders.length === 0 && (
              <div className="p-8 text-center text-gray-400 italic">
                Nenhuma entrega pendente por enquanto.
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions / Tips */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-6 rounded-xl text-white shadow-lg">
            <h3 className="text-lg font-bold mb-2">Dica de Markup 💡</h3>
            <p className="text-pink-100 text-sm mb-4">
              Lembre-se de considerar embalagens e fitas no custo de cada receita para não perder margem!
            </p>
            <Link 
              href="/ingredientes" 
              className="inline-block bg-white text-pink-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-pink-50 transition-colors"
            >
              Cadastrar Embalagem
            </Link>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Acesso Rápido</h3>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/pedidos/novo" className="p-4 border rounded-lg text-center hover:bg-pink-50 hover:border-pink-200 transition-all group">
                <ShoppingBag className="w-6 h-6 mx-auto mb-2 text-gray-400 group-hover:text-pink-500" />
                <span className="text-sm font-medium text-gray-600">Novo Pedido</span>
              </Link>
              <Link href="/receitas/nova" className="p-4 border rounded-lg text-center hover:bg-pink-50 hover:border-pink-200 transition-all group">
                <Clock className="w-6 h-6 mx-auto mb-2 text-gray-400 group-hover:text-pink-500" />
                <span className="text-sm font-medium text-gray-600">Nova Receita</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
