import { db } from "@/db";
import { ingredients } from "@/db/schema";
import { addIngredient, deleteIngredient } from "./actions";
import { Trash2, Plus, Receipt } from "lucide-react";
import BulkImport from "./BulkImport";

export default async function IngredientesPage() {
  const allIngredients = await db.select().from(ingredients).orderBy(ingredients.name);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Ingredientes</h1>
          <p className="text-gray-500">Gerencie seus insumos e custos base</p>
        </div>
      </div>

      <BulkImport />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form to add ingredient */}
        <div className="bg-white p-6 rounded-xl shadow-sm border h-fit">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Plus className="w-5 h-5 mr-2 text-pink-500" />
            Novo Ingrediente
          </h2>
          <form action={addIngredient} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome</label>
              <input
                name="name"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm border p-2"
                placeholder="Ex: Leite Moça"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Preço Compra (R$)</label>
                <input
                  name="purchasePrice"
                  type="number"
                  step="0.01"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm border p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Qtd Compra</label>
                <input
                  name="purchaseQuantity"
                  type="number"
                  step="0.01"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm border p-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Unidade</label>
              <select
                name="unit"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm border p-2"
              >
                <option value="g">Gramas (g)</option>
                <option value="ml">Mililitros (ml)</option>
                <option value="un">Unidade (un)</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700 transition-colors font-medium"
            >
              Adicionar
            </button>
          </form>
        </div>

        {/* List of ingredients */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço Compra</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custo Unit.</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allIngredients.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.purchaseQuantity}{item.unit} comprados</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    R$ {parseFloat(item.purchasePrice).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-pink-600">
                    R$ {parseFloat(item.costPerUnit).toFixed(4)}/{item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <form action={async () => { "use server"; await deleteIngredient(item.id); }}>
                      <button type="submit" className="text-red-600 hover:text-red-900">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {allIngredients.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500 italic">
                    Nenhum ingrediente cadastrado ainda.
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
