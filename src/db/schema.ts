import { pgTable, serial, text, timestamp, numeric, integer, date } from "drizzle-orm/pg-core";

export const ingredients = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  unit: text("unit").notNull(), // unidade base usada nas receitas: g, ml ou un
  packageLabel: text("package_label").default("unidade"), // caixa, lata, pacote, unidade...
  purchasePrice: numeric("purchase_price", { precision: 10, scale: 2 }).notNull(), // preço padrão de compra da embalagem
  purchaseQuantity: numeric("purchase_quantity", { precision: 10, scale: 2 }).notNull(), // quanto vem dentro de 1 embalagem
  costPerUnit: numeric("cost_per_unit", { precision: 10, scale: 4 }).notNull(), // custo estimado por unidade base
  minimumStock: numeric("minimum_stock", { precision: 10, scale: 2 }).default("0"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const stockBatches = pgTable("stock_batches", {
  id: serial("id").primaryKey(),
  ingredientId: integer("ingredient_id").references(() => ingredients.id).notNull(),
  packageLabel: text("package_label").notNull(),
  packageCount: numeric("package_count", { precision: 10, scale: 2 }).notNull(),
  quantityPerPackage: numeric("quantity_per_package", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  totalQuantity: numeric("total_quantity", { precision: 10, scale: 2 }).notNull(),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).default("0"),
  costPerUnit: numeric("cost_per_unit", { precision: 10, scale: 4 }).default("0"),
  supplier: text("supplier"),
  expiresAt: date("expires_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  laborCost: numeric("labor_cost", { precision: 10, scale: 2 }).default("0"),
  markup: numeric("markup", { precision: 10, scale: 2 }).default("100"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const recipeIngredients = pgTable("recipe_ingredients", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").references(() => recipes.id).notNull(),
  ingredientId: integer("ingredient_id").references(() => ingredients.id).notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  deliveryDate: date("delivery_date").notNull(),
  status: text("status").default("pending").notNull(),
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
