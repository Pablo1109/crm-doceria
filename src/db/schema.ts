// Keep the schema entrypoint present so models can define tables and run
// `npx drizzle-kit push` without bootstrapping Drizzle config first.
import { pgTable, serial, text, timestamp, numeric, integer, date } from "drizzle-orm/pg-core";

export const ingredients = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  unit: text("unit").notNull(), // 'g', 'ml', 'un'
  purchasePrice: numeric("purchase_price", { precision: 10, scale: 2 }).notNull(),
  purchaseQuantity: numeric("purchase_quantity", { precision: 10, scale: 2 }).notNull(),
  costPerUnit: numeric("cost_per_unit", { precision: 10, scale: 4 }).notNull(), // Preço por 1g ou 1ml
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  laborCost: numeric("labor_cost", { precision: 10, scale: 2 }).default("0"),
  markup: numeric("markup", { precision: 10, scale: 2 }).default("100"), // Porcentagem de lucro
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const recipeIngredients = pgTable("recipe_ingredients", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").references(() => recipes.id).notNull(),
  ingredientId: integer("ingredient_id").references(() => ingredients.id).notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(), // Quantidade usada na receita
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  deliveryDate: date("delivery_date").notNull(),
  status: text("status").default("pending").notNull(), // 'pending', 'confirmed', 'delivered', 'cancelled'
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  recipeId: integer("recipe_id").references(() => recipes.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
});
