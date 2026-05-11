"use client";

import { useState } from "react";
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createOrder } from "@/app/pedidos/actions";
import { useRouter } from "next/navigation";

interface Recipe {
  id: number;
  name: string;
  suggestedPrice: number;
}

export default function OrderForm({ recipes }: { recipes: Recipe[] }) {
  const router = useRouter();
  const [items, setItems] = useState<{ recipeId: number, quantity: number, unitPrice: number }[]>([]);
  
  const addItem = () => {
    setItems([...items, { recipeId: recipes[0]?.id || 0, quantity: 1, unitPrice: recipes[0]?.suggestedPrice || 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    
    // If recipe changes, update price
    if (field === 'recipeId') {
      const recipe = recipes.find(r => r.id === parseInt(value));
      if (recipe) {
        newItems[index].unitPrice = recipe.suggestedPrice;
      }
    }
    
    setItems(newItems);
  };

  const total = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await createOrder(formData, items);
    router.push("/pedidos");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/pedidos" className="flex items-center text-gray-500 hover:text-pink-600 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar para pedidos
      </Link>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Customer Info */}
          <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
            <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Dados do Cliente</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome do Cliente</label>
              <input name="customerName" required className="mt-1 block w-full border rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">WhatsApp / Telefone</label>
              <input name="customerPhone" className="mt-1 block w-full border rounded-md p-2" placeholder="(00) 00000-0000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Data de Entrega</label>
              <input name="deliveryDate" type="date" required className="mt-1 block w-full border rounded-md p-2" />
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Observações</h2>
            <textarea name="notes" rows={7} className="w-full border rounded-md p-2" placeholder="Detalhes do tema, cores, recheios especiais..." />
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-gray-700">Produtos</h2>
            <button 
              type="button" 
              onClick={addItem}
              className="bg-pink-100 text-pink-700 px-3 py-1 rounded text-sm font-bold flex items-center hover:bg-pink-200 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Produto
            </button>
          </div>
          
          <div className="p-6 space-y-4">
            {items.map((item, index) => (
              <div key={index} className="flex flex-wrap md:flex-nowrap gap-4 items-end border-b pb-4 last:border-0 last:pb-0">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Produto</label>
                  <select 
                    value={item.recipeId} 
                    onChange={(e) => updateItem(index, 'recipeId', e.target.value)}
                    className="w-full border rounded-md p-2"
                  >
                    {recipes.map(r => (
                      <option key={r.id} value={r.id}>{r.name} (R$ {r.suggestedPrice.toFixed(2)})</option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Qtd</label>
                  <input 
                    type="number" 
                    value={item.quantity} 
                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                    className="w-full border rounded-md p-2"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Preço Unit.</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={item.unitPrice} 
                    onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value))}
                    className="w-full border rounded-md p-2"
                  />
                </div>
                <div className="w-32 text-right">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Subtotal</label>
                  <p className="p-2 font-bold text-pink-600">R$ {(item.quantity * item.unitPrice).toFixed(2)}</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => removeItem(index)}
                  className="p-2 text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            
            {items.length === 0 && (
              <p className="text-center text-gray-400 py-4 italic">Nenhum produto adicionado ao pedido.</p>
            )}
          </div>

          <div className="bg-gray-50 p-6 flex justify-between items-center border-t">
            <div className="text-2xl font-black text-gray-800">
              Total: <span className="text-pink-600">R$ {total.toFixed(2)}</span>
            </div>
            <button 
              type="submit"
              disabled={items.length === 0}
              className="bg-pink-600 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-pink-700 transition-all disabled:opacity-50 flex items-center"
            >
              <Save className="w-5 h-5 mr-2" /> Salvar Pedido
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
