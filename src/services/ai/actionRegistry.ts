import { z } from "zod";

export interface ActionDefinition<I extends z.ZodTypeAny = any, O = any> {
  name: string;
  description: string;
  inputSchema: I;
  execute: (input: z.infer<I>, userId: number) => Promise<O>;
}

class ActionRegistry {
  private actions = new Map<string, ActionDefinition>();

  public register(action: ActionDefinition) {
    this.actions.set(action.name, action);
  }

  public get(name: string): ActionDefinition | undefined {
    return this.actions.get(name);
  }

  public getAll(): ActionDefinition[] {
    return Array.from(this.actions.values());
  }

  public getPromptDescriptions(): { name: string; description: string; schemaJson: string }[] {
    return this.getAll().map(a => ({
      name: a.name,
      description: a.description,
      // Representação simples e amigável do schema para a IA
      schemaJson: this.schemaToFriendlyJson(a.inputSchema)
    }));
  }

  private schemaToFriendlyJson(schema: z.ZodTypeAny): string {
    // Um helper simples para converter Zod em uma string JSON descritiva para a IA
    if (schema instanceof z.ZodObject) {
      const shape = schema.shape;
      const res: Record<string, string> = {};
      for (const key in shape) {
        const field = shape[key];
        let typeStr = "unknown";
        if (field instanceof z.ZodString) typeStr = "string";
        else if (field instanceof z.ZodNumber) typeStr = "number";
        else if (field instanceof z.ZodBoolean) typeStr = "boolean";
        else if (field instanceof z.ZodArray) typeStr = "array";
        else if (field instanceof z.ZodOptional) typeStr = "optional";
        else if (field instanceof z.ZodNullable) typeStr = "nullable";
        res[key] = typeStr;
      }
      return JSON.stringify(res, null, 2);
    }
    return "any";
  }
}

import { scheduleEventAction } from "../plugins/calendar/actions";
import { registerManualTransactionAction, consultFinanceAction } from "../plugins/finance/actions";
import { createPurchaseAction, consultInventoryAction } from "../plugins/inventory/actions";
import { createOrderAction } from "../plugins/orders/actions";

export const actionRegistry = new ActionRegistry();

// Registrando as ações de forma linear e limpa (evitando dependência circular!)
actionRegistry.register(scheduleEventAction);
actionRegistry.register(registerManualTransactionAction);
actionRegistry.register(consultFinanceAction);
actionRegistry.register(createPurchaseAction);
actionRegistry.register(consultInventoryAction);
actionRegistry.register(createOrderAction);
