"use client";

import { updateOrderStatus } from "./actions";

export default function StatusSelect({ id, currentStatus }: { id: number, currentStatus: string }) {
  const statusLabels: Record<string, string> = {
    pending: "Pendente",
    confirmed: "Confirmado",
    delivered: "Entregue",
    cancelled: "Cancelado",
  };

  return (
    <select 
      defaultValue={currentStatus}
      onChange={async (e) => {
         await updateOrderStatus(id, e.target.value);
      }}
      className="text-xs border rounded p-1 bg-white"
    >
      {Object.entries(statusLabels).map(([value, label]) => (
        <option key={value} value={value}>{label}</option>
      ))}
    </select>
  );
}
