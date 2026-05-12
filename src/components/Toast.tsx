"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

const messages: Record<string, string> = {
  ingrediente: "Ingrediente cadastrado com sucesso.",
  estoque: "Entrada de estoque salva com sucesso.",
  ajuste: "Ajuste de estoque salvo com sucesso.",
  receita: "Receita atualizada com sucesso.",
  pedido: "Pedido salvo com sucesso.",
  status: "Status atualizado com sucesso.",
  excluido: "Registro excluído com sucesso.",
};

export default function Toast({ type }: { type?: string }) {
  const [show, setShow] = useState(Boolean(type));
  useEffect(() => {
    if (!type) return;
    setShow(true);
    const timer = setTimeout(() => setShow(false), 3600);
    return () => clearTimeout(timer);
  }, [type]);

  if (!type || !show) return null;
  return (
    <div className="fixed right-4 top-4 z-50 animate-toast-in rounded-3xl border border-[#f1d8cf] bg-white/95 px-5 py-4 text-sm font-bold text-[#5b382d] shadow-2xl shadow-rose-100 backdrop-blur">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        {messages[type] || "Alteração salva com sucesso."}
      </div>
    </div>
  );
}
