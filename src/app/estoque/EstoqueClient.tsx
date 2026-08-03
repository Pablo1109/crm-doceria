"use client";
import { useState } from "react";
import { money, numberValue } from "@/lib/format";
import { Boxes, PackageCheck, AlertTriangle, Search, Info, Plus, ChevronRight, X, RotateCcw } from "lucide-react";
import { addStock, adjustStock, deleteStockBatch } from "@/app/ingredientes/actions";
import SubmitButton from "@/components/SubmitButton";

type Ingredient = {
  id: number;
  name: string;
  unit: string;
  packageLabel: string | null;
  purchasePrice: string;
  purchaseQuantity: string;
  costPerUnit: string;
  minimumStock: string | null;
};

type Batch = {
  id: number;
  ingredientId: number;
  ingredientName: string;
  packageLabel: string;
  packageCount: string;
  quantityPerPackage: string;
  unit: string;
  totalQuantity: string;
  totalPrice: string | null;
  costPerUnit: string | null;
  supplier: string | null;
  expiresAt: string | null;
  createdAt: Date;
};

type EstoqueClientProps = {
  ingredients: Ingredient[];
  batches: Batch[];
  consumptionMap: Record<number, number>;
};

export default function EstoqueClient({ ingredients, batches, consumptionMap }: EstoqueClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "compra" | "ajuste">("info");

  // Calcular totais de estoque
  const totals = new Map<number, number>();
  batches.forEach((b) => totals.set(b.ingredientId, (totals.get(b.ingredientId) || 0) + numberValue(b.totalQuantity)));
  
  const totalValue = batches.reduce((s, b) => s + numberValue(b.totalQuantity) * numberValue(b.costPerUnit), 0);

  // Filtrar ingredientes baseados na pesquisa
  const filteredIngredients = ingredients.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mapear cor do jarro com base no nome do ingrediente
  function getIngredientColor(name: string) {
    const n = name.toLowerCase();
    if (n.includes("chocolate") || n.includes("cacau") || n.includes("brigadeiro") || n.includes("nissin")) return "#8B4513"; // Marrom cacau
    if (n.includes("leite") || n.includes("creme") || n.includes("condensado")) return "#FFFDD0"; // Creme/Amarelado
    if (n.includes("morango") || n.includes("framboesa") || n.includes("cereja")) return "#FF5C5C"; // Vermelho morango
    if (n.includes("coco")) return "#F0F0F0"; // Coco ralado/branco
    if (n.includes("açúcar") || n.includes("trigo") || n.includes("farinha")) return "#EAEAEA"; // Branco farinha
    if (n.includes("granulado") || n.includes("confeito")) return "#FF69B4"; // Rosa confeito
    return "#F5A3B7"; // Rosa pastel padrão La Délice
  }

  return (
    <div className="space-y-7">
      {/* Cards superiores */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card-soft rounded-[2rem] p-6 bg-white flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-rose-50 text-rose-500">
            <Boxes className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[#9a6d5c]">Ingredientes Ativos</p>
            <p className="mt-1 text-3xl font-black text-[#5b382d]">{ingredients.length}</p>
          </div>
        </div>
        <div className="card-soft rounded-[2rem] p-6 bg-white flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-500">
            <PackageCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[#9a6d5c]">Valor Físico Estimado</p>
            <p className="mt-1 text-3xl font-black text-[#5b382d]">{money(totalValue)}</p>
          </div>
        </div>
      </div>

      {/* Caixa de pesquisa */}
      <div className="flex items-center gap-3 bg-white border border-[#ead8cf] rounded-2xl px-4 py-3 shadow-sm max-w-md">
        <Search className="h-5 w-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Buscar ingrediente no armário..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent border-none outline-none text-sm placeholder:text-slate-400 text-slate-900"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm("")} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Representação Visual: O Armário de Estoque */}
      <div className="card-soft rounded-[2.5rem] p-6 md:p-8 bg-gradient-to-b from-[#fbf5f0] to-[#f5ebd6] border border-[#ead8cf] shadow-xl relative overflow-hidden">
        {/* Detalhes de madeira do topo */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-[#8b5e4d] rounded-t-[2.5rem] shadow-md z-10" />
        
        <div className="mb-6 flex justify-between items-center z-20 relative">
          <div>
            <h2 className="text-2xl font-black text-[#5b382d]">O Armário de Estoque</h2>
            <p className="text-xs text-[#8b6a5d] font-bold">Toque em qualquer pote para ver a validade, histórico ou dar entrada e ajuste.</p>
          </div>
          <div className="flex gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" /> Estoque crítico
            </span>
          </div>
        </div>

        {/* Shelves (Prateleiras) */}
        <div className="space-y-12 py-4 z-20 relative">
          {/* Lógica para agrupar ingredientes em prateleiras (3 ingredientes por linha) */}
          {Array.from({ length: Math.ceil(filteredIngredients.length / 3) }).map((_, shelfIndex) => {
            const shelfIngredients = filteredIngredients.slice(shelfIndex * 3, shelfIndex * 3 + 3);
            
            return (
              <div key={shelfIndex} className="relative pb-6">
                {/* Fileira de potes */}
                <div className="grid grid-cols-3 gap-4 text-center items-end px-2 md:px-8">
                  {shelfIngredients.map((item) => {
                    const stock = totals.get(item.id) || 0;
                    const min = numberValue(item.minimumStock);
                    const isLow = stock <= min;
                    const consumption = consumptionMap[item.id] || 0;
                    
                    // Cálculo de duração
                    const avgDaily = consumption / 30;
                    const durationDays = avgDaily > 0 ? Math.ceil(stock / avgDaily) : null;

                    // Cálculo da porcentagem do pote
                    let fillPercent = 0;
                    if (stock > 0) {
                      if (min === 0) {
                        fillPercent = 85; // Se não tem mínimo, exibe preenchimento padrão saudável
                      } else {
                        fillPercent = Math.min(95, Math.max(15, (stock / min) * 45));
                      }
                    }

                    return (
                      <div 
                        key={item.id} 
                        onClick={() => {
                          setSelectedIngredient(item);
                          setActiveTab("info");
                        }}
                        className="group flex flex-col items-center cursor-pointer transition-transform hover:-translate-y-2 relative"
                      >
                        {/* Pote Visual de Vidro */}
                        <div className="relative w-16 h-28 md:w-24 md:h-36 rounded-b-[1.5rem] rounded-t-[0.8rem] border-2 border-white/60 bg-white/10 backdrop-blur-xs shadow-lg flex flex-col justify-end overflow-hidden ring-1 ring-slate-900/5 group-hover:border-rose-300 group-hover:ring-rose-200">
                          {/* Tampa do Pote */}
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[85%] h-3 bg-[#c99a88] border-b border-[#a87563] rounded-t-md shadow-xs z-30" />
                          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[70%] h-1 bg-[#8b5e4d] rounded-full z-30 opacity-40" />

                          {/* Preenchimento líquido/pó */}
                          <div 
                            className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out z-10" 
                            style={{ 
                              height: `${fillPercent}%`, 
                              backgroundColor: getIngredientColor(item.name) 
                            }}
                          >
                            {/* Efeito ondulado no topo do ingrediente */}
                            <div className="absolute top-0 left-0 right-0 h-1.5 opacity-30 bg-white" />
                          </div>

                          {/* Vidro reflexo vertical */}
                          <div className="absolute top-4 left-2 w-1.5 h-[80%] bg-white/25 rounded-full z-20" />
                          <div className="absolute top-4 right-2 w-0.5 h-[65%] bg-white/10 rounded-full z-20" />

                          {/* Alerta de Estoque Crítico */}
                          {isLow && (
                            <div className="absolute inset-0 flex items-center justify-center bg-red-950/20 z-20 animate-pulse">
                              <AlertTriangle className="h-6 w-6 text-red-500 drop-shadow-md" />
                            </div>
                          )}

                          {/* Texto de quantidade dentro do pote */}
                          <div className="z-20 text-[10px] md:text-xs font-black text-slate-800 bg-white/75 backdrop-blur-xs px-1 py-0.5 rounded-md mb-2 shadow-xs max-w-[90%] truncate self-center">
                            {stock.toLocaleString("pt-BR")} {item.unit}
                          </div>
                        </div>

                        {/* Rótulo do ingrediente */}
                        <p className="mt-2 text-xs font-black text-[#5b382d] group-hover:text-rose-600 line-clamp-1 max-w-full">
                          {item.name}
                        </p>

                        {/* Indicador de tempo de duração */}
                        <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                          {isLow ? (
                            <span className="text-red-500 font-extrabold uppercase text-[9px] tracking-wider">Repor</span>
                          ) : durationDays !== null ? (
                            <span>Dura +{durationDays}d</span>
                          ) : (
                            <span className="opacity-60 font-normal">Estável</span>
                          )}
                        </p>
                      </div>
                    );
                  })}
                  {/* Se a pesquisa não retornar itens */}
                  {shelfIngredients.length === 0 && (
                    <div className="col-span-3 py-6 text-slate-400 italic text-sm">Nenhum ingrediente aqui...</div>
                  )}
                </div>

                {/* Prateleira de madeira visual */}
                <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-r from-[#8b5e4d] via-[#a87563] to-[#8b5e4d] rounded-full shadow-lg border-b border-[#5a392b] z-0" />
                <div className="absolute bottom-[-4px] left-[5%] right-[5%] h-1 bg-[#5b382d]/30 blur-xs rounded-full z-0" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Painel Lateral / Modal de Ingrediente Selecionado */}
      {selectedIngredient && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-xs transition-opacity animate-toast-in">
          {/* Backdrop click to close */}
          <div className="absolute inset-0" onClick={() => setSelectedIngredient(null)} />

          <div className="relative w-full max-w-md h-full bg-[#fffcf9] border-l border-[#ead8cf] p-6 shadow-2xl flex flex-col z-10 overflow-hidden">
            {/* Header do painel */}
            <div className="flex items-start justify-between border-b border-[#ead8cf] pb-4 mb-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-[#c98b9b]">Detalhes do Ingrediente</p>
                <h3 className="text-2xl font-black text-[#5b382d] mt-1">{selectedIngredient.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedIngredient(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Abas */}
            <div className="flex border-b border-[#ead8cf] mb-5">
              <button 
                onClick={() => setActiveTab("info")} 
                className={`flex-1 pb-3 text-sm font-black text-center cursor-pointer border-b-2 transition ${activeTab === "info" ? "border-rose-400 text-rose-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
              >
                Informações
              </button>
              <button 
                onClick={() => setActiveTab("compra")} 
                className={`flex-1 pb-3 text-sm font-black text-center cursor-pointer border-b-2 transition ${activeTab === "compra" ? "border-rose-400 text-rose-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
              >
                Lançar Compra
              </button>
              <button 
                onClick={() => setActiveTab("ajuste")} 
                className={`flex-1 pb-3 text-sm font-black text-center cursor-pointer border-b-2 transition ${activeTab === "ajuste" ? "border-rose-400 text-rose-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
              >
                Ajuste Manual
              </button>
            </div>

            {/* Conteúdo das abas */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1">
              
              {activeTab === "info" && (
                <div className="space-y-5">
                  {/* Card de status */}
                  <div className="rounded-3xl bg-white border border-[#ead8cf] p-4 space-y-3">
                    <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                      <span className="text-slate-500 font-bold">Estoque atual:</span>
                      <span className="font-black text-lg text-[#c98b9b]">
                        {(totals.get(selectedIngredient.id) || 0).toLocaleString("pt-BR")} {selectedIngredient.unit}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                      <span className="text-slate-500 font-bold">Estoque mínimo cadastrado:</span>
                      <span className="font-bold text-slate-800">
                        {numberValue(selectedIngredient.minimumStock).toLocaleString("pt-BR")} {selectedIngredient.unit}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                      <span className="text-slate-500 font-bold">Consumo (últimos 30 dias):</span>
                      <span className="font-bold text-slate-800">
                        {(consumptionMap[selectedIngredient.id] || 0).toLocaleString("pt-BR")} {selectedIngredient.unit}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-bold">Duração estimada:</span>
                      <span className="font-black text-rose-500">
                        {(() => {
                          const cons = consumptionMap[selectedIngredient.id] || 0;
                          const stock = totals.get(selectedIngredient.id) || 0;
                          if (cons === 0) return "Sem histórico de uso";
                          const days = Math.ceil(stock / (cons / 30));
                          return `Aprox. ${days} dias`;
                        })()}
                      </span>
                    </div>
                  </div>

                  {/* Lotes ativos */}
                  <div>
                    <h4 className="text-sm font-black text-[#5b382d] uppercase tracking-wider mb-2">Lotes em estoque</h4>
                    <div className="space-y-2">
                      {batches
                        .filter(b => b.ingredientId === selectedIngredient.id)
                        .map(b => (
                          <div key={b.id} className="rounded-2xl border border-slate-100 bg-white p-3.5 flex justify-between items-center text-xs shadow-xs hover:border-rose-200">
                            <div>
                              <p className="font-black text-slate-800">
                                {numberValue(b.packageCount).toLocaleString("pt-BR")} {b.packageLabel} de {numberValue(b.quantityPerPackage).toLocaleString("pt-BR")}{b.unit}
                              </p>
                              <p className="text-slate-400 mt-1">
                                Fornecedor: {b.supplier || "Não informado"}
                              </p>
                              {b.expiresAt && (
                                <p className="text-slate-500 font-bold mt-0.5">
                                  Validade: {new Date(`${b.expiresAt}T12:00:00`).toLocaleDateString("pt-BR")}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-black text-[#c98b9b]">{numberValue(b.totalQuantity).toLocaleString("pt-BR")} {b.unit} restando</p>
                              <form action={async () => {
                                if (confirm("Excluir este lote de estoque? O valor correspondente será excluído do cofre.")) {
                                  await deleteStockBatch(b.id);
                                  setSelectedIngredient(null);
                                }
                              }} className="mt-1">
                                <button type="submit" className="text-red-400 hover:text-red-600 transition font-bold cursor-pointer">
                                  Excluir
                                </button>
                              </form>
                            </div>
                          </div>
                        ))}
                      {batches.filter(b => b.ingredientId === selectedIngredient.id).length === 0 && (
                        <p className="text-slate-400 text-center italic py-4 text-xs">Nenhum lote ativo. Ingrediente zerado.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "compra" && (
                <form action={addStock} onSubmit={() => setSelectedIngredient(null)} className="space-y-4">
                  <input type="hidden" name="ingredientId" value={selectedIngredient.id} />
                  
                  <div className="rounded-2xl bg-[#fff1f4] p-3 text-xs leading-5 text-[#7b4b3f]">
                    Dando entrada de estoque para <b>{selectedIngredient.name}</b>.
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs font-black uppercase text-[#9a6d5c]">Quantas embalagens?
                      <input name="packageCount" required type="number" step="0.01" placeholder="Ex: 5" className="mt-1.5 w-full rounded-xl border border-[#ead8cf] bg-white px-3 py-2.5 text-sm" />
                    </label>
                    <label className="block text-xs font-black uppercase text-[#9a6d5c]">Tipo embalagem
                      <select name="packageLabel" className="mt-1.5 w-full rounded-xl border border-[#ead8cf] bg-white px-3 py-2.5 text-sm">
                        <option value={selectedIngredient.packageLabel || "unidade"}>{selectedIngredient.packageLabel || "Padrão"}</option>
                        <option value="caixa">Caixa</option>
                        <option value="lata">Lata</option>
                        <option value="pacote">Pacote</option>
                        <option value="pote">Pote</option>
                        <option value="saco">Saco</option>
                        <option value="unidade">Unidade</option>
                      </select>
                    </label>
                  </div>

                  <label className="block text-xs font-black uppercase text-[#9a6d5c]">Conteúdo por embalagem ({selectedIngredient.unit})
                    <input name="quantityPerPackage" required type="number" step="0.01" defaultValue={numberValue(selectedIngredient.purchaseQuantity)} className="mt-1.5 w-full rounded-xl border border-[#ead8cf] bg-white px-3 py-2.5 text-sm" />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs font-black uppercase text-[#9a6d5c]">Valor total pago (R$)
                      <input name="totalPrice" required type="number" step="0.01" placeholder="Ex: 32,50" className="mt-1.5 w-full rounded-xl border border-[#ead8cf] bg-white px-3 py-2.5 text-sm" />
                    </label>
                    <label className="block text-xs font-black uppercase text-[#9a6d5c]">Validade
                      <input name="expiresAt" type="date" className="mt-1.5 w-full rounded-xl border border-[#ead8cf] bg-white px-3 py-2.5 text-sm" />
                    </label>
                  </div>

                  <label className="block text-xs font-black uppercase text-[#9a6d5c]">Fornecedor
                    <input name="supplier" placeholder="Ex: Assaí, Atacadão..." className="mt-1.5 w-full rounded-xl border border-[#ead8cf] bg-white px-3 py-2.5 text-sm" />
                  </label>

                  <SubmitButton pendingText="Adicionando..." className="w-full rounded-xl bg-[#5b382d] py-3 text-sm font-black text-white hover:bg-[#c98b9b]">
                    Salvar Compra no Estoque
                  </SubmitButton>
                </form>
              )}

              {activeTab === "ajuste" && (
                <form action={adjustStock} onSubmit={() => setSelectedIngredient(null)} className="space-y-4">
                  <input type="hidden" name="ingredientId" value={selectedIngredient.id} />
                  
                  <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs leading-5 text-amber-800">
                    Ajustes de estoque corrigem a quantidade sem lançar custo no cofre (útil para perdas ou acertos).
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <label className="block text-xs font-black uppercase text-[#9a6d5c]">Ajuste
                      <select name="type" className="mt-1.5 w-full rounded-xl border border-[#ead8cf] bg-white px-3 py-2.5 text-sm">
                        <option value="saida">Saída (Perda/Uso)</option>
                        <option value="entrada">Entrada (Acerto)</option>
                      </select>
                    </label>
                    <label className="block text-xs font-black uppercase text-[#9a6d5c]">Embalagens
                      <input name="packageCount" required type="number" step="0.01" placeholder="Ex: 1" className="mt-1.5 w-full rounded-xl border border-[#ead8cf] bg-white px-3 py-2.5 text-sm" />
                    </label>
                    <label className="block text-xs font-black uppercase text-[#9a6d5c]">Qtd por Emb.
                      <input name="quantityPerPackage" required type="number" step="0.01" defaultValue={numberValue(selectedIngredient.purchaseQuantity)} className="mt-1.5 w-full rounded-xl border border-[#ead8cf] bg-white px-3 py-2.5 text-sm" />
                    </label>
                  </div>

                  <label className="block text-xs font-black uppercase text-[#9a6d5c]">Motivo do ajuste
                    <input name="notes" placeholder="Ex: Perda por validade, derramou, etc." className="mt-1.5 w-full rounded-xl border border-[#ead8cf] bg-white px-3 py-2.5 text-sm" />
                  </label>

                  <SubmitButton pendingText="Salvando..." className="w-full rounded-xl bg-amber-600 py-3 text-sm font-black text-white hover:bg-amber-700">
                    Salvar Ajuste Manual
                  </SubmitButton>
                </form>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
