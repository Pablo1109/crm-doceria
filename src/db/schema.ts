import { pgTable, serial, text, timestamp, numeric, integer, date, boolean } from "drizzle-orm/pg-core";

export const ingredients = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  unit: text("unit").notNull(), // unidade base usada nas receitas: g, ml ou un
  packageLabel: text("package_label").default("unidade"), // caixa, lata, pacote, unidade...
  purchasePrice: numeric("purchase_price", { precision: 10, scale: 2 }).notNull(), // preço padrão de compra da embalagem
  purchaseQuantity: numeric("purchase_quantity", { precision: 10, scale: 2 }).notNull(), // quanto vem dentro de 1 embalagem
  costPerUnit: numeric("cost_per_unit", { precision: 10, scale: 4 }).notNull(), // custo estimado por unidade base
  minimumStock: numeric("minimum_stock", { precision: 10, scale: 2 }).default("0"),
  minimumPackageCount: numeric("minimum_package_count", { precision: 10, scale: 2 }).default("0"),
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
  yield: integer("yield").default(35).notNull(), // Rendimento padrão de docinhos (ex: 35)
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
  deliveryTime: text("delivery_time"),
  partyDate: date("party_date"),
  partyTime: text("party_time"),
  status: text("status").default("pending").notNull(),
  settled: boolean("settled").default(false).notNull(),
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

// Tabela de usuários para acesso compartilhado
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(), // Armazena a senha com hash SHA-256 simples
  role: text("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tabela de compromissos e eventos de parceria do calendário
export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  eventDate: date("event_date").notNull(),
  eventTime: text("event_time"),
  type: text("type").default("task").notNull(), // 'task', 'partnership', 'meeting', 'other'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tabela de transações financeiras para o Cofre
export const financialTransactions = pgTable("financial_transactions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'income' (recebimento), 'expense' (gasto de estoque/custo fixo), 'withdrawal' (retirada de lucro)
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  date: date("date").notNull(),
  category: text("category").default("geral").notNull(), // 'pedido', 'ingrediente', 'pro-labore', 'despesa-fixa', 'outro'
  referenceId: integer("reference_id"), // link opcional para o ID do pedido ou lote de estoque
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Histórico de Conversas e Mensagens da IA
export const aiConversations = pgTable("ai_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  model: text("model").notNull(),
  provider: text("provider").notNull(),
  totalTokens: integer("total_tokens").default(0).notNull(),
  totalCost: numeric("total_cost", { precision: 10, scale: 6 }).default("0").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
});

export const aiMessages = pgTable("ai_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => aiConversations.id).notNull(),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  attachments: text("attachments"), // Caminho opcional ou base64 de imagem/documento
  intent: text("intent"),
  parsedJson: text("parsed_json"), // JSON estruturado da resposta da IA
  executedAction: text("executed_action"),
  success: boolean("success").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

