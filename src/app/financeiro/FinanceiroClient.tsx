"use client";
import { useState, useMemo } from "react";
import { money } from "@/lib/format";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Lock,
  Unlock,
  HelpCircle,
  PiggyBank,
  Wallet,
  X,
  CheckCircle2,
  CalendarCheck,
  Edit
} from "lucide-react";
import { addTransaction, deleteTransaction } from "./actions";
import { settleOrder } from "@/app/pedidos/actions";
import SubmitButton from "@/components/SubmitButton";
import Link from "next/link";

type Transaction = {
  id: number;
  type: string; // 'income', 'expense', 'withdrawal'
  amount: string;
  description: string;
  date: string;
  category: string;
  referenceId: number | null;
};

type OrderCost = {
  orderId: number;
  date: string;
  revenue: number;
  cost: number;
};

type PendingOrder = {
  id: number;
  customerName: string;
  deliveryDate: string;
  totalAmount: string | null;
};

type FinanceiroClientProps = {
  transactions: Transaction[];
  orderCosts: OrderCost[];
  pendingOrders: PendingOrder[];
};

export default function FinanceiroClient({ transactions, orderCosts, pendingOrders }: FinanceiroClientProps) {
  const [safeOpen, setSafeOpen] = useState(false);
  const [selectedFortnight, setSelectedFortnight] = useState(() => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();
    const fortnight = today.getDate() <= 15 ? "q1" : "q2";
    return `${year}-${month}-${fortnight}`;
  });
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSettling, setIsSettling] = useState<Record<number, boolean>>({});

  // Gerar opções de quinzenas nos últimos 6 meses
  const fortnightOptions = useMemo(() => {
    const options = [];
    const monthsNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    
    const today = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const mNum = String(d.getMonth() + 1).padStart(2, "0");
      const y = d.getFullYear();
      const mName = monthsNames[d.getMonth()];
      
      // 2ª quinzena primeiro (ordem decrescente)
      options.push({
        value: `${y}-${mNum}-q2`,
        label: `${mName} de ${y} — 2ª Quinzena (16-fim)`
      });
      // 1ª quinzena
      options.push({
        value: `${y}-${mNum}-q1`,
        label: `${mName} de ${y} — 1ª Quinzena (01-15)`
      });
    }
    return options;
  }, []);

  // Filtrar dados da quinzena selecionada
  const activePeriodData = useMemo(() => {
    const [year, month, qPart] = selectedFortnight.split("-");
    const yNum = Number(year);
    const mNum = Number(month);
    
    // Filtros de data
    const startDate = `${year}-${month}-${qPart === "q1" ? "01" : "16"}`;
    const lastDay = new Date(yNum, mNum, 0).getDate();
    const endDate = `${year}-${month}-${qPart === "q1" ? "15" : lastDay}`;

    // 1. Filtrar transações financeiras da quinzena
    const periodTransactions = transactions.filter(t => 
      t.date >= startDate && t.date <= endDate
    );

    // 2. Filtrar custos de pedidos da quinzena (Lucro Real)
    const periodOrderCosts = orderCosts.filter(o => 
      o.date >= startDate && o.date <= endDate
    );

    // 3. Filtrar encomendas entregues pendentes de acerto da quinzena (Previsão de Entradas)
    const periodPendingOrders = pendingOrders.filter(o => 
      o.deliveryDate >= startDate && o.deliveryDate <= endDate
    );

    // Cálculos de Caixa (Cofre) do Período
    const income = periodTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);
      
    const expense = periodTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);
      
    const withdrawal = periodTransactions
      .filter(t => t.type === "withdrawal")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const safeBalance = income - expense - withdrawal;

    // Saldo físico do cofre (todas as transações já acertadas em todos os tempos)
    const physicalSafeBalance = transactions.reduce((sum, t) => {
      if (t.type === "income") return sum + Number(t.amount);
      if (t.type === "expense" || t.type === "withdrawal") return sum - Number(t.amount);
      return sum;
    }, 0);

    // Soma das previsões de entradas da quinzena (pedido concluído mas não acertado/pago)
    const opPendingForecast = periodPendingOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    // Cálculos Operacionais/Lucro Real da Quinzena
    const opRevenue = periodOrderCosts.reduce((sum, o) => sum + o.revenue, 0);
    const opIngredientsCost = periodOrderCosts.reduce((sum, o) => sum + o.cost, 0);
    const opProfit = opRevenue - opIngredientsCost;
    const opMargin = opRevenue > 0 ? (opProfit / opRevenue) * 100 : 0;

    return {
      periodTransactions,
      periodPendingOrders,
      income,
      expense,
      withdrawal,
      safeBalance,
      physicalSafeBalance,
      opPendingForecast,
      opRevenue,
      opIngredientsCost,
      opProfit,
      opMargin,
      startDate,
      endDate
    };
  }, [selectedFortnight, transactions, orderCosts, pendingOrders]);

  const handleSettle = async (orderId: number) => {
    setIsSettling(prev => ({ ...prev, [orderId]: true }));
    try {
      await settleOrder(orderId);
    } catch (err) {
      console.error("Erro ao acertar pedido:", err);
    } finally {
      setIsSettling(prev => ({ ...prev, [orderId]: false }));
    }
  };

  return (
    <div className="space-y-8">
      {/* Seletor de Quinzena */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white border border-[#ead8cf] p-4 rounded-3xl shadow-sm">
        <div>
          <label className="text-xs font-black uppercase tracking-wider text-[#9a6d5c] block mb-1">Período de Análise</label>
          <select 
            value={selectedFortnight} 
            onChange={(e) => setSelectedFortnight(e.target.value)}
            className="rounded-xl border border-[#ead8cf] px-4 py-2.5 text-sm font-bold text-[#5b382d] bg-[#fff8ef] focus:outline-none cursor-pointer"
          >
            {fortnightOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#5b382d] hover:bg-[#c98b9b] text-white px-5 py-3 text-sm font-black transition cursor-pointer shadow-sm"
        >
          <Plus className="h-4.5 w-4.5" /> Lançar Despesa Manual
        </button>
      </div>

      {/* Formulário de Nova Transação */}
      {showAddForm && (
        <form action={addTransaction} onSubmit={() => setShowAddForm(false)} className="card-soft rounded-[2rem] p-6 space-y-4 bg-white animate-toast-in">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-lg font-black text-[#5b382d]">Lançar nova movimentação manual no cofre</h3>
            <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block text-xs font-black uppercase text-[#9a6d5c]">Tipo
              <select name="type" className="mt-1.5 w-full rounded-xl border border-[#ead8cf] bg-white px-3 py-2.5 text-sm cursor-pointer">
                <option value="expense">Despesa (Saída)</option>
                <option value="withdrawal">Retirada de Pró-labore (Saída)</option>
              </select>
            </label>
            <label className="block text-xs font-black uppercase text-[#9a6d5c]">Categoria
              <select name="category" className="mt-1.5 w-full rounded-xl border border-[#ead8cf] bg-white px-3 py-2.5 text-sm cursor-pointer">
                <option value="despesa-fixa">Custo Fixo (Gás, Energia, Aluguel)</option>
                <option value="embalagem">Embalagens</option>
                <option value="pro-labore">Retirada / Pró-labore</option>
                <option value="outro">Outro gasto administrativo</option>
              </select>
            </label>
            <label className="block text-xs font-black uppercase text-[#9a6d5c]">Valor (R$)
              <input name="amount" required type="number" step="0.01" placeholder="Ex: 50,00" className="mt-1.5 w-full rounded-xl border border-[#ead8cf] bg-white px-3 py-2.5 text-sm" />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-xs font-black uppercase text-[#9a6d5c]">Descrição / Motivo
              <input name="description" required placeholder="Ex: Compra de fitas de cetim" className="mt-1.5 w-full rounded-xl border border-[#ead8cf] bg-white px-3 py-2.5 text-sm" />
            </label>
            <label className="block text-xs font-black uppercase text-[#9a6d5c]">Data
              <input name="date" required type="date" defaultValue={new Date().toISOString().split("T")[0]} className="mt-1.5 w-full rounded-xl border border-[#ead8cf] bg-white px-3 py-2.5 text-sm" />
            </label>
          </div>

          <SubmitButton pendingText="Registrando..." className="w-full rounded-xl bg-[#5b382d] py-3 text-sm font-black text-white hover:bg-[#c98b9b]">
            Salvar Lançamento no Cofre
          </SubmitButton>
        </form>
      )}

      {/* Grid de Balanço e Cofre */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        
        {/* Cofre Físico Visual */}
        <div className="card-soft rounded-[2.5rem] p-6 bg-gradient-to-b from-slate-800 to-slate-950 border border-slate-700 shadow-2xl flex flex-col justify-between min-h-[380px] text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-slate-700 rounded-t-[2.5rem] opacity-35" />
          <div className="absolute top-10 right-10 w-28 h-28 bg-white/5 rounded-full blur-xl pointer-events-none" />

          <div className="z-10 flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Caixa Geral Físico</p>
              <h2 className="text-2xl font-black text-white mt-1">O Cofre da Doceria</h2>
            </div>
            <button 
              onClick={() => setSafeOpen(!safeOpen)}
              className={`p-3 rounded-2xl cursor-pointer shadow-md transition-all flex items-center justify-center ${safeOpen ? "bg-[#c98b9b] text-slate-950 animate-pulse" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}
            >
              {safeOpen ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
            </button>
          </div>

          {/* Interface do cofre físico */}
          <div className="my-8 flex justify-center items-center relative z-10">
            {!safeOpen ? (
              <div 
                onClick={() => setSafeOpen(true)}
                className="w-36 h-36 md:w-44 md:h-44 rounded-full border-8 border-slate-700 bg-gradient-to-tr from-slate-600 to-slate-800 shadow-inner flex items-center justify-center cursor-pointer transition hover:scale-105 active:rotate-45 relative"
              >
                <div className="absolute w-full h-2 bg-slate-900/40" />
                <div className="absolute w-2 h-full bg-slate-900/40" />
                <div className="w-16 h-16 rounded-full border-4 border-slate-900 bg-slate-700 shadow-lg flex items-center justify-center">
                  <Lock className="h-6 w-6 text-slate-400" />
                </div>
                <p className="absolute bottom-[-30px] text-[10px] font-black uppercase tracking-widest text-slate-400">Toque para abrir</p>
              </div>
            ) : (
              <div className="text-center animate-toast-in space-y-4">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-[#ffe4ef] text-rose-500 shadow-inner">
                  <PiggyBank className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Dinheiro Acertado no Cofre</p>
                  <p className="text-4xl font-black text-rose-300 mt-1 tracking-tight">
                    {money(activePeriodData.physicalSafeBalance)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-2 font-bold leading-relaxed max-w-xs mx-auto">
                    Dinheiro físico real acumulado de todas as entradas concluidas e de fato **acertadas/pagas** menos despesas.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-800/80 pt-4 z-10 flex justify-between text-xs text-slate-400 font-bold">
            <span>Caixa Entrada Quinzena:</span>
            <span className={activePeriodData.safeBalance >= 0 ? "text-emerald-400" : "text-rose-400"}>
              {activePeriodData.safeBalance >= 0 ? "+" : ""} {money(activePeriodData.safeBalance)}
            </span>
          </div>
        </div>

        {/* Análise da Quinzena e Resultados */}
        <div className="card-soft rounded-[2.5rem] p-6 bg-white border border-[#ead8cf] flex flex-col justify-between shadow-sm">
          <div>
            <h2 className="text-xl font-black text-[#5b382d]">Balanço da Quinzena</h2>
            <p className="text-xs text-[#8b6a5d] mt-1 font-bold">
              Detalhamento de {new Date(`${activePeriodData.startDate}T12:00:00`).toLocaleDateString("pt-BR")} até {new Date(`${activePeriodData.endDate}T12:00:00`).toLocaleDateString("pt-BR")}
            </p>

            <div className="grid grid-cols-3 gap-3 mt-6">
              <div className="rounded-2xl bg-emerald-50/50 p-3 border border-emerald-100/60">
                <div className="flex items-center gap-1 text-emerald-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Entradas</span>
                </div>
                <p className="mt-1 text-base font-black text-slate-900">{money(activePeriodData.income)}</p>
                <span className="text-[8px] text-slate-400 font-bold">Já Acertado</span>
              </div>

              <div className="rounded-2xl bg-amber-50/40 p-3 border border-amber-100/60">
                <div className="flex items-center gap-1 text-amber-600">
                  <CalendarCheck className="h-4 w-4" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Previsão</span>
                </div>
                <p className="mt-1 text-base font-black text-slate-900">{money(activePeriodData.opPendingForecast)}</p>
                <span className="text-[8px] text-slate-400 font-bold">A Receber</span>
              </div>

              <div className="rounded-2xl bg-rose-50/40 p-3 border border-rose-100/60">
                <div className="flex items-center gap-1 text-rose-500">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Saídas</span>
                </div>
                <p className="mt-1 text-base font-black text-slate-900">{money(activePeriodData.expense)}</p>
                <span className="text-[8px] text-slate-400 font-bold">Despesas</span>
              </div>
            </div>

            {/* Pró-labore lançado na quinzena */}
            <div className="mt-4 flex justify-between items-center rounded-2xl bg-violet-50/50 p-3.5 border border-violet-100 text-xs">
              <span className="text-slate-600 font-bold flex items-center gap-1.5"><Wallet className="h-4 w-4 text-violet-500" /> Pró-labore Retirado:</span>
              <span className="font-black text-slate-900">{money(activePeriodData.withdrawal)}</span>
            </div>

            {/* Resultado Operacional (Lucro Real das Receitas Vendidas) */}
            <div className="mt-5 border-t border-slate-100 pt-4 space-y-3.5">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#9a6d5c] flex items-center gap-1">
                Resultado Operacional (Lucro Real)
                <span title="Calcula o faturamento exato das receitas vendidas menos o custo real de ingredientes usados nessas receitas na quinzena.">
                  <HelpCircle className="h-3.5 w-3.5 text-slate-400 cursor-help" />
                </span>
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-500">Faturamento da Quinzena</p>
                  <p className="text-sm font-black text-[#5b382d]">{money(activePeriodData.opRevenue)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500">Custo Real de Ingredientes (COGS)</p>
                  <p className="text-sm font-black text-[#5b382d]">{money(activePeriodData.opIngredientsCost)}</p>
                </div>
              </div>

              <div className="flex justify-between items-center bg-[#fff8ef] rounded-2xl p-3.5 border border-[#ead8cf] shadow-inner">
                <div>
                  <p className="text-xs font-bold text-[#8b6a5d]">Lucro Operacional Estimado</p>
                  <p className="text-xl font-black text-[#5b382d] mt-0.5">{money(activePeriodData.opProfit)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-[#8b6a5d]">Margem de Lucro</p>
                  <p className="text-xl font-black text-rose-500 mt-0.5">{activePeriodData.opMargin.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Seção de Acerto de Contas da Quinzena (NOVA) */}
      <div className="card-soft overflow-hidden rounded-[2rem] bg-white border border-[#ead8cf]">
        <div className="border-b border-[#ead8cf] bg-[#fffcf9] p-5">
          <h2 className="text-lg font-black text-[#5b382d]">Acerto de Contas da Quinzena</h2>
          <p className="text-xs text-[#8b6a5d] mt-1 font-bold">
            Marque as encomendas entregues nesta quinzena que foram de fato pagas/acertadas para que o valor entre no Caixa.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#f0ded6] text-left">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-4 text-xs font-black uppercase text-[#9a6d5c]">Data de Entrega</th>
                <th className="px-6 py-4 text-xs font-black uppercase text-[#9a6d5c]">Cliente</th>
                <th className="px-6 py-4 text-xs font-black uppercase text-[#9a6d5c]">Valor do Pedido</th>
                <th className="px-6 py-4 text-xs font-black uppercase text-[#9a6d5c]">Situação</th>
                <th className="px-6 py-4 text-right text-xs font-black uppercase text-[#9a6d5c]">Acertar Conta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0ded6]">
              {activePeriodData.periodPendingOrders.map(order => (
                <tr key={order.id} className="hover:bg-[#fff1f4]/40 text-xs">
                  <td className="px-6 py-4 font-bold text-[#7b4b3f]">
                    {new Date(`${order.deliveryDate}T12:00:00`).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-6 py-4 font-black text-[#5b382d]">{order.customerName}</td>
                  <td className="px-6 py-4 font-black text-sm text-[#5b382d]">{money(order.totalAmount)}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded-full font-bold uppercase text-[9px] border bg-amber-50 text-amber-700 border-amber-200">
                      Pendente de Acerto
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleSettle(order.id)}
                      disabled={isSettling[order.id]}
                      className="inline-flex items-center gap-1 text-[10px] uppercase font-black bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl cursor-pointer transition disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> 
                      {isSettling[order.id] ? "Processando..." : "Confirmar Acerto"}
                    </button>
                  </td>
                </tr>
              ))}
              {activePeriodData.periodPendingOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">
                    Nenhum pedido entregue pendente de acerto nesta quinzena.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Livro de Movimentações da Quinzena */}
      <div className="card-soft overflow-hidden rounded-[2rem] bg-white border border-[#ead8cf]">
        <div className="border-b border-[#ead8cf] bg-[#fff8ef] p-5">
          <h2 className="text-lg font-black text-[#5b382d]">Movimentações do Caixa do Período</h2>
          <p className="text-xs text-[#8b6a5d] mt-1 font-bold">Todas as movimentações já acertadas/efetuadas no cofre.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#f0ded6] text-left">
            <thead className="bg-[#fffcf9]">
              <tr>
                <th className="px-6 py-4 text-xs font-black uppercase text-[#9a6d5c]">Data</th>
                <th className="px-6 py-4 text-xs font-black uppercase text-[#9a6d5c]">Descrição</th>
                <th className="px-6 py-4 text-xs font-black uppercase text-[#9a6d5c]">Categoria</th>
                <th className="px-6 py-4 text-xs font-black uppercase text-[#9a6d5c]">Tipo</th>
                <th className="px-6 py-4 text-xs font-black uppercase text-[#9a6d5c]">Valor</th>
                <th className="px-6 py-4 text-right text-xs font-black uppercase text-[#9a6d5c]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0ded6]">
              {activePeriodData.periodTransactions.map(t => (
                <tr key={t.id} className="hover:bg-[#fff1f4]/40 text-xs">
                  <td className="px-6 py-4 font-bold text-[#7b4b3f]">
                    {new Date(`${t.date}T12:00:00`).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-6 py-4 font-black text-[#5b382d]">{t.description}</td>
                  <td className="px-6 py-4 capitalize text-[#7b4b3f]">
                    {t.category.replace("-", " ")}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] border ${
                      t.type === "income" 
                        ? "bg-green-50 text-green-700 border-green-200" 
                        : t.type === "withdrawal"
                          ? "bg-violet-50 text-violet-700 border-violet-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {t.type === "income" ? "Entrada" : t.type === "withdrawal" ? "Retirada" : "Saída"}
                    </span>
                  </td>
                  <td className={`px-6 py-4 font-black text-sm ${t.type === "income" ? "text-emerald-600" : "text-slate-800"}`}>
                    {t.type === "income" ? "+" : "-"} {money(t.amount)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {t.category === "pedido" || t.category === "ingrediente" ? (
                      <span className="text-[10px] text-slate-400 font-bold" title="Lançamentos automáticos devem ser excluídos nas abas de Pedidos ou Estoque.">Automático</span>
                    ) : (
                      <>
                        <Link href={`/financeiro/edit/${t.id}`} className="inline-flex items-center gap-1 text-sm text-[#5b382d] hover:underline">
                          <Edit className="h-4 w-4" /> Editar
                        </Link>
                        <form action={async () => {
                          if (confirm("Excluir este lançamento manual do cofre?")) {
                            await deleteTransaction(t.id);
                          }
                        }}>
                          <button type="submit" className="text-red-400 hover:text-red-600 transition p-1 hover:bg-red-50 rounded-lg cursor-pointer">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </form>
                      </>
                    
                                )}
                  </td>
                </tr>
              ))}
              {activePeriodData.periodTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    Nenhuma movimentação financeira consolidada nesta quinzena.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
