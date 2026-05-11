"use client";
import { updateOrderStatus } from "./actions";
const options = [{ value: "pending", label: "Orçamento" }, { value: "confirmed", label: "Confirmado" }, { value: "production", label: "Em produção" }, { value: "finished", label: "Finalizado" }, { value: "delivered", label: "Entregue" }, { value: "cancelled", label: "Cancelado" }];
export default function StatusSelect({ id, currentStatus }: { id: number; currentStatus: string }) { return <select defaultValue={currentStatus} onChange={async (e) => updateOrderStatus(id, e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 outline-none">{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>; }
