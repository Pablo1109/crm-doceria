"use client";

import { useState } from "react";
import { Receipt, Sparkles, AlertCircle } from "lucide-react";
import { addIngredient } from "./actions";

export default function BulkImport() {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<any[]>([]);

  const parseText = () => {
    const lines = text.split('\n');
    const results = [];
    for (const line of lines) {
      if (!line.trim()) continue;
      // Regex for: Item Name [Quantity] [Unit] [Price]
      // Example: "Leite Moça 395g 7,50"
      const regex = /(.+?)\s+(\d+)(g|ml|un)\s+(?:R\$|)\s*(\d+[,.]\d+)/i;
      const match = line.match(regex);
      if (match) {
        const [_, name, qty, unit, price] = match;
        results.push({
          name: name.trim(),
          purchaseQuantity: qty,
          unit: unit.toLowerCase(),
          purchasePrice: price.replace(',', '.')
        });
      }
    }
    setPreview(results);
  };

  const handleImport = async () => {
    for (const item of preview) {
      const formData = new FormData();
      formData.append("name", item.name);
      formData.append("unit", item.unit);
      formData.append("purchasePrice", item.purchasePrice);
      formData.append("purchaseQuantity", item.purchaseQuantity);
      await addIngredient(formData);
    }
    setText("");
    setPreview([]);
    alert("Ingredientes importados com sucesso!");
  };

  return (
    <div className="bg-pink-50 p-6 rounded-xl border border-pink-100 mb-8">
      <h2 className="text-lg font-bold text-pink-800 mb-2 flex items-center">
        <Sparkles className="w-5 h-5 mr-2" />
        Assistente de Insumos (IA Simples)
      </h2>
      <p className="text-sm text-pink-700 mb-4">
        Cole aqui o texto da sua nota ou lista de compras. Ex: <code className="bg-white px-1 rounded">Farinha 1000g 5.50</code>
      </p>
      
      <div className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nome QuantidadeUnidade Preço"
          className="w-full h-32 p-3 rounded-md border-pink-200 border focus:ring-pink-500 focus:border-pink-500 text-sm"
        />
        
        <div className="flex gap-2">
          <button
            onClick={parseText}
            className="bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700 transition-colors text-sm font-bold"
          >
            Analisar Texto
          </button>
        </div>

        {preview.length > 0 && (
          <div className="mt-4 bg-white p-4 rounded-lg border border-pink-200">
            <h3 className="text-sm font-bold text-gray-700 mb-2">Itens Detectados:</h3>
            <ul className="text-xs space-y-1">
              {preview.map((item, i) => (
                <li key={i} className="flex justify-between border-b pb-1 last:border-0">
                  <span>{item.name} - {item.purchaseQuantity}{item.unit}</span>
                  <span className="font-bold">R$ {item.purchasePrice}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={handleImport}
              className="w-full mt-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-bold"
            >
              Confirmar e Salvar {preview.length} itens
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
