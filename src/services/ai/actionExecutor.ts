import { actionRegistry } from "./actionRegistry";

export interface ExecutionResult {
  success: boolean;
  message: string;
  data?: any;
  errors?: string[];
}

export async function executeAction(intent: string, data: any, userId: number): Promise<ExecutionResult> {
  const action = actionRegistry.get(intent);
  if (!action) {
    return {
      success: false,
      message: `Ação operacional '${intent}' não cadastrada no sistema.`
    };
  }

  console.log(`[ActionExecutor] Executando intent: ${intent} para o usuário: ${userId}`);

  // Validar dados estruturados de entrada com Zod
  const result = action.inputSchema.safeParse(data);
  if (!result.success) {
    const errorMessages = result.error.errors.map((err: any) => `${err.path.join(".")}: ${err.message}`);
    console.warn(`[ActionExecutor] Validação falhou para ${intent}:`, errorMessages);
    return {
      success: false,
      message: "Os dados identificados pela IA não possuem todos os campos necessários ou contêm valores incorretos.",
      errors: errorMessages
    };
  }

  try {
    // Executar a lógica contida no serviço unificado do plugin
    const executionData = await action.execute(result.data, userId);
    return {
      success: true,
      message: executionData.message || "Ação operacional executada com sucesso!",
      data: executionData
    };
  } catch (err: any) {
    console.error(`[ActionExecutor] Falha na execução da Action '${intent}':`, err);
    return {
      success: false,
      message: `Erro na execução do serviço interno: ${err.message || err}`
    };
  }
}
