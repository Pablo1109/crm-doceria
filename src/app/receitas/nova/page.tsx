import { db } from "@/db";
import { ingredients } from "@/db/schema";
import NovaReceitaClient from "./NovaReceitaClient";

export const metadata = {
  title: "Nova Receita | La Délice",
};

export default async function NovaReceitaPage() {
  // Buscar lista de todos os ingredientes cadastrados para vincular na ficha técnica
  const allIngredients = await db
    .select()
    .from(ingredients)
    .orderBy(ingredients.name)
    .catch(() => []);

  return (
    <NovaReceitaClient ingredientsList={allIngredients} />
  );
}
