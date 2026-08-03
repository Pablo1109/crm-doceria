"use client";
import { useState, useMemo } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Phone, 
  Compass, 
  CheckSquare, 
  AlertCircle,
  MessageCircle
} from "lucide-react";
import { addCalendarEvent, deleteCalendarEvent } from "./actions";
import SubmitButton from "@/components/SubmitButton";
import { money } from "@/lib/format";

type Order = {
  id: number;
  customerName: string;
  customerPhone: string | null;
  deliveryDate: string;
  deliveryTime: string | null;
  partyDate: string | null;
  partyTime: string | null;
  status: string;
  totalAmount: string | null;
  notes: string | null;
};

type OrderItemDetail = {
  orderId: number;
  recipeName: string;
  quantity: number;
};

type CustomEvent = {
  id: number;
  title: string;
  description: string | null;
  eventDate: string;
  eventTime: string | null;
  type: string;
};

type CalendarioClientProps = {
  orders: Order[];
  orderItems: OrderItemDetail[];
  customEvents: CustomEvent[];
};

export default function CalendarioClient({ orders, orderItems, customEvents }: CalendarioClientProps) {
  // Estado para controle do mês sendo visualizado
  const [currentDate, setCurrentDate] = useState(() => new Date());
  
  // Estado para dia selecionado (padrão é hoje)
  const [selectedDateStr, setSelectedDateStr] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const [showAddEventModal, setShowAddEventModal] = useState(false);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Nomes dos meses e dias da semana
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // Mudar mês
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Gerar dias do mês no calendário
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();

    const days = [];

    // Dias do mês anterior para preenchimento
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const day = prevMonthTotalDays - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      days.push({ day, currentMonth: false, dateStr });
    }

    // Dias do mês atual
    for (let i = 1; i <= totalDays; i++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({ day: i, currentMonth: true, dateStr });
    }

    // Dias do próximo mês para completar a grade
    const remainingSlots = 42 - days.length; // Grade padrão de 6 linhas
    for (let i = 1; i <= remainingSlots; i++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({ day: i, currentMonth: false, dateStr });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Indexar dados por data para acesso rápido
  const eventsByDate = useMemo(() => {
    const map: Record<string, { orders: Order[]; customEvents: CustomEvent[] }> = {};
    
    orders.forEach(o => {
      if (!map[o.deliveryDate]) map[o.deliveryDate] = { orders: [], customEvents: [] };
      map[o.deliveryDate].orders.push(o);
    });

    customEvents.forEach(e => {
      if (!map[e.eventDate]) map[e.eventDate] = { orders: [], customEvents: [] };
      map[e.eventDate].customEvents.push(e);
    });

    return map;
  }, [orders, customEvents]);

  // Dados do dia selecionado
  const selectedDayData = useMemo(() => {
    const dayData = eventsByDate[selectedDateStr] || { orders: [], customEvents: [] };
    
    // Calcular soma dos docinhos a serem produzidos para as entregas deste dia
    const sweetsChecklist: Record<string, number> = {};
    dayData.orders.forEach(order => {
      // Filtrar itens deste pedido
      const items = orderItems.filter(item => item.orderId === order.id);
      items.forEach(item => {
        sweetsChecklist[item.recipeName] = (sweetsChecklist[item.recipeName] || 0) + item.quantity;
      });
    });

    return {
      orders: dayData.orders,
      customEvents: dayData.customEvents,
      sweetsChecklist
    };
  }, [selectedDateStr, eventsByDate, orderItems]);

  const statusColors: Record<string, string> = {
    pending: "border-yellow-200 text-yellow-800 bg-yellow-50",
    confirmed: "border-blue-200 text-blue-800 bg-blue-50",
    delivered: "border-emerald-200 text-emerald-800 bg-emerald-50",
    finished: "border-emerald-200 text-emerald-800 bg-emerald-50",
    cancelled: "border-red-200 text-red-800 bg-red-50",
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      
      {/* Calendário Mensal */}
      <div className="card-soft rounded-[2.5rem] bg-white border border-[#ead8cf] p-6 shadow-sm flex flex-col justify-between">
        
        {/* Cabeçalho do Calendário */}
        <div className="flex items-center justify-between border-b border-[#ead8cf] pb-4 mb-6">
          <div>
            <h2 className="text-2xl font-black text-[#5b382d]">
              {monthNames[currentMonth]} <span className="text-[#c98b9b] font-bold">{currentYear}</span>
            </h2>
            <p className="text-xs text-[#8b6a5d] font-bold">Gerencie prazos de entrega e compromissos.</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handlePrevMonth}
              className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-[#5b382d] hover:text-rose-500 cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button 
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-2 text-xs font-black bg-[#fff8ef] text-[#5b382d] border border-[#ead8cf] rounded-xl hover:bg-rose-50 cursor-pointer"
            >
              Hoje
            </button>
            <button 
              onClick={handleNextMonth}
              className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-[#5b382d] hover:text-rose-500 cursor-pointer"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Grade de dias */}
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {/* Dias da semana */}
          {weekDays.map(wd => (
            <div key={wd} className="text-center text-xs font-black uppercase text-[#9a6d5c] py-2">
              {wd}
            </div>
          ))}

          {/* Células de dias */}
          {calendarDays.map(({ day, currentMonth: isCurrMonth, dateStr }) => {
            const isSelected = dateStr === selectedDateStr;
            const isToday = dateStr === new Date().toISOString().split("T")[0];
            const data = eventsByDate[dateStr];
            
            const dayOrders = data?.orders || [];
            const dayCustomEvents = data?.customEvents || [];
            const hasActivity = dayOrders.length > 0 || dayCustomEvents.length > 0;

            return (
              <div 
                key={dateStr}
                onClick={() => setSelectedDateStr(dateStr)}
                className={`min-h-[75px] md:min-h-[95px] p-1.5 rounded-2xl border flex flex-col justify-between transition cursor-pointer select-none ${
                  isSelected 
                    ? "border-rose-400 bg-rose-50/50 shadow-inner" 
                    : isToday
                      ? "border-emerald-300 bg-emerald-50/30"
                      : isCurrMonth 
                        ? "border-[#f2e6de]/70 bg-white hover:bg-rose-50/20" 
                        : "border-slate-50 bg-slate-50/30 text-slate-400 opacity-60"
                }`}
              >
                {/* Dia numérico */}
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-black flex h-5 w-5 items-center justify-center rounded-lg ${
                    isToday ? "bg-emerald-500 text-white" : isSelected ? "text-rose-500 font-extrabold" : "text-[#5b382d]"
                  }`}>
                    {day}
                  </span>
                  
                  {/* Badge contador */}
                  {hasActivity && (
                    <span className="h-2 w-2 rounded-full bg-rose-400" />
                  )}
                </div>

                {/* Eventos mini-listagem (limitar a 2 itens) */}
                <div className="space-y-0.5 mt-1.5 hidden md:block">
                  {dayOrders.slice(0, 2).map(o => (
                    <div 
                      key={o.id}
                      className="text-[9px] font-black leading-3 truncate px-1 py-0.5 rounded-md border border-rose-100 bg-rose-50/80 text-rose-800"
                    >
                      {o.deliveryTime ? `${o.deliveryTime} ` : ""} {o.customerName}
                    </div>
                  ))}
                  {dayCustomEvents.slice(0, 2 - Math.min(2, dayOrders.length)).map(e => (
                    <div 
                      key={e.id}
                      className="text-[9px] font-black leading-3 truncate px-1 py-0.5 rounded-md border border-violet-100 bg-violet-50/80 text-violet-800"
                    >
                      {e.eventTime ? `${e.eventTime} ` : ""} {e.title}
                    </div>
                  ))}
                  {/* Indicador de mais itens */}
                  {(dayOrders.length + dayCustomEvents.length) > 2 && (
                    <div className="text-[8px] font-black text-slate-400 text-center">
                      +{dayOrders.length + dayCustomEvents.length - 2} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Barra Lateral: Checklist de Produção do Dia */}
      <div className="card-soft rounded-[2.5rem] bg-white border border-[#ead8cf] p-6 shadow-sm flex flex-col justify-between h-full">
        <div className="space-y-6">
          {/* Header da Barra Lateral */}
          <div className="border-b border-[#ead8cf] pb-4">
            <p className="text-xs font-black uppercase tracking-widest text-[#c98b9b] flex items-center gap-1.5">
              <CalendarIcon className="h-4 w-4" /> Checklist de Produção
            </p>
            <h3 className="text-xl font-black text-[#5b382d] mt-1.5">
              {new Date(`${selectedDateStr}T12:00:00`).toLocaleDateString("pt-BR", { 
                weekday: 'long', 
                day: '2-digit', 
                month: 'long' 
              })}
            </h3>
          </div>

          {/* Checklist de Doces a Produzir */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-[#9a6d5c] mb-3 flex items-center gap-1">
              <CheckSquare className="h-4 w-4 text-[#c98b9b]" /> Docinhos para Fazer Hoje
            </h4>
            <div className="space-y-2">
              {Object.entries(selectedDayData.sweetsChecklist).map(([name, qty]) => (
                <div key={name} className="flex justify-between items-center rounded-2xl border border-slate-100 bg-[#fffcf9] px-4 py-3 text-sm shadow-inner hover:border-rose-200">
                  <span className="font-black text-[#5b382d]">{name}</span>
                  <span className="font-extrabold text-rose-500 bg-rose-50 px-3 py-1 rounded-xl text-sm border border-rose-100">
                    {qty} unidades
                  </span>
                </div>
              ))}
              {Object.keys(selectedDayData.sweetsChecklist).length === 0 && (
                <p className="text-slate-400 italic text-xs py-2">Sem produção de doces agendada para hoje.</p>
              )}
            </div>
          </div>

          {/* Encomendas detalhadas do dia */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-[#9a6d5c] mb-3 flex items-center gap-1">
              <Clock className="h-4 w-4 text-[#c98b9b]" /> Cronograma de Entregas
            </h4>
            <div className="space-y-3">
              {selectedDayData.orders.map(order => {
                const phone = order.customerPhone?.replace(/\D/g,"") || "";
                return (
                  <div key={order.id} className="rounded-3xl border border-slate-100 p-4 bg-white shadow-xs hover:border-rose-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-black text-[#5b382d] text-sm">{order.customerName}</p>
                        <p className="text-xs text-[#8b6a5d] mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" /> 
                          Entrega: <b>{order.deliveryTime || "Não informado"}</b>
                        </p>
                        {order.partyTime && (
                          <p className="text-xs text-[#9a6d5c] mt-0.5">
                            Horário da Festa: {order.partyTime}
                          </p>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${statusColors[order.status]}`}>
                        {order.status === "pending" ? "Pendente" : order.status === "confirmed" ? "Confirmado" : "Entregue"}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-2 text-xs">
                      <span className="font-extrabold text-rose-500">{money(order.totalAmount)}</span>
                      <div className="flex gap-2">
                        {phone && (
                          <a 
                            href={`https://wa.me/55${phone}`} 
                            target="_blank"
                            className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition flex items-center justify-center cursor-pointer"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </a>
                        )}
                        <a 
                          href={`/pedidos/${order.id}`}
                          className="px-2.5 py-1.5 bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-500 rounded-xl font-black text-[10px] uppercase border transition"
                        >
                          Ver Detalhes
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
              {selectedDayData.orders.length === 0 && (
                <p className="text-slate-400 italic text-xs py-2">Nenhuma entrega de encomenda cadastrada.</p>
              )}
            </div>
          </div>

          {/* Tarefas e compromissos de parceria */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-[#9a6d5c] mb-3 flex items-center gap-1">
              <Compass className="h-4 w-4 text-[#c98b9b]" /> Parcerias e Notas do Dia
            </h4>
            <div className="space-y-2">
              {selectedDayData.customEvents.map(ev => (
                <div key={ev.id} className="rounded-2xl border border-violet-100 bg-violet-50/20 p-3.5 flex justify-between items-start text-xs hover:bg-violet-50/40">
                  <div>
                    <div className="flex items-center gap-1.5 font-black text-violet-950">
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                      {ev.title}
                    </div>
                    {ev.eventTime && (
                      <p className="text-violet-700 mt-1 font-bold">Horário: {ev.eventTime}</p>
                    )}
                    {ev.description && (
                      <p className="text-slate-500 mt-1 font-medium">{ev.description}</p>
                    )}
                  </div>
                  <form action={async () => {
                    if (confirm("Excluir este compromisso?")) {
                      await deleteCalendarEvent(ev.id);
                    }
                  }}>
                    <button type="submit" className="text-red-400 hover:text-red-600 transition cursor-pointer">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              ))}
              {selectedDayData.customEvents.length === 0 && (
                <p className="text-slate-400 italic text-xs py-2">Nenhum compromisso extra.</p>
              )}
            </div>
          </div>
        </div>

        {/* Botão de Lançar Evento Extra */}
        <div className="mt-6 border-t border-slate-100 pt-4">
          <button 
            onClick={() => setShowAddEventModal(true)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#5b382d] hover:bg-[#c98b9b] text-white py-3 text-sm font-black transition cursor-pointer shadow-xs"
          >
            <Plus className="h-4.5 w-4.5" /> Adicionar Compromisso Extra
          </button>
        </div>
      </div>

      {/* Modal para Adicionar Evento Customizado */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs transition-opacity animate-toast-in">
          <div className="absolute inset-0" onClick={() => setShowAddEventModal(false)} />
          
          <form 
            action={addCalendarEvent}
            onSubmit={() => setShowAddEventModal(false)}
            className="relative w-full max-w-md bg-[#fffcf9] rounded-[2.2rem] border border-[#ead8cf] p-6 shadow-2xl space-y-4 z-10 m-4"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-[#5b382d]">Novo compromisso / parceria</h3>
              <button type="button" onClick={() => setShowAddEventModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="block text-xs font-black uppercase text-[#9a6d5c]">Título do Compromisso
              <input name="title" required placeholder="Ex: Entregar amostra de beijinho na assessoria" className="mt-1.5 w-full rounded-xl border border-[#ead8cf] bg-white px-4 py-3 text-sm" />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-black uppercase text-[#9a6d5c]">Data
                <input name="eventDate" required type="date" defaultValue={selectedDateStr} className="mt-1.5 w-full rounded-xl border border-[#ead8cf] bg-white px-4 py-3 text-sm" />
              </label>
              <label className="block text-xs font-black uppercase text-[#9a6d5c]">Horário (Opcional)
                <input name="eventTime" type="time" className="mt-1.5 w-full rounded-xl border border-[#ead8cf] bg-white px-4 py-3 text-sm" />
              </label>
            </div>

            <label className="block text-xs font-black uppercase text-[#9a6d5c]">Tipo
              <select name="type" className="mt-1.5 w-full rounded-xl border border-[#ead8cf] bg-white px-4 py-3 text-sm cursor-pointer">
                <option value="partnership">Parceria / Festa Externa</option>
                <option value="task">Tarefa Operacional</option>
                <option value="meeting">Reunião / Visita</option>
                <option value="other">Outro</option>
              </select>
            </label>

            <label className="block text-xs font-black uppercase text-[#9a6d5c]">Observações
              <textarea name="description" rows={3} placeholder="Endereço, detalhes combinados..." className="mt-1.5 w-full rounded-xl border border-[#ead8cf] bg-white px-4 py-3 text-sm" />
            </label>

            <SubmitButton pendingText="Adicionando..." className="w-full rounded-xl bg-[#5b382d] py-3.5 text-sm font-black text-white hover:bg-[#c98b9b]">
              Salvar Compromisso
            </SubmitButton>
          </form>
        </div>
      )}

    </div>
  );
}
