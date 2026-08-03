"use server";

import { db } from "@/db";
import { aiConversations, aiMessages } from "@/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { extractTextFromImage } from "@/lib/ocr/ocrProvider";
import { buildSystemContext } from "@/lib/ai/contextBuilder";
import { buildSystemPrompt } from "@/lib/ai/promptBuilder";
import { generateStructuredResponse, AIResponse } from "@/lib/ai/aiProvider";
import { actionRegistry } from "@/services/ai/actionRegistry";
import { executeAction } from "@/services/ai/actionExecutor";
import { revalidatePath } from "next/cache";

export async function getOrCreateConversation() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Usuário não autenticado");

  // Buscar última conversa ativa do usuário nas últimas 2 horas
  const [lastConv] = await db
    .select()
    .from(aiConversations)
    .where(eq(aiConversations.userId, user.id))
    .orderBy(desc(aiConversations.startedAt))
    .limit(1);

  if (lastConv && (Date.now() - new Date(lastConv.startedAt).getTime() < 1000 * 60 * 120)) {
    return lastConv.id;
  }

  const [newConv] = await db
    .insert(aiConversations)
    .values({
      userId: user.id,
      model: "gemini-1.5-flash",
      provider: "google"
    })
    .returning();

  return newConv.id;
}

export async function getConversationMessages(conversationId: number) {
  return await db
    .select()
    .from(aiMessages)
    .where(eq(aiMessages.conversationId, conversationId))
    .orderBy(asc(aiMessages.createdAt))
    .catch(() => []);
}

export async function sendMessageToAssistant(conversationId: number, message: string, imageBase64?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Usuário não autenticado");

  let finalPrompt = message;
  let ocrResultText = "";

  // 1. Executar OCR se houver anexo de imagem
  if (imageBase64) {
    try {
      ocrResultText = await extractTextFromImage(imageBase64);
      finalPrompt = `${message}\n\n[CONTEÚDO EXTRAÍDO DA FOTO POR OCR]:\n${ocrResultText}`;
    } catch (err) {
      console.error("Falha ao rodar OCR na imagem:", err);
      ocrResultText = "Falha ao ler o texto da imagem.";
    }
  }

  // 2. Salvar mensagem do usuário no banco
  const [userMsg] = await db.insert(aiMessages).values({
    conversationId,
    role: "user",
    content: message,
    attachments: imageBase64 || null
  }).returning();

  // 3. Buscar histórico da conversa para atuar como memória
  const recentMessages = await db
    .select()
    .from(aiMessages)
    .where(eq(aiMessages.conversationId, conversationId))
    .orderBy(asc(aiMessages.createdAt))
    .limit(10)
    .catch(() => []);

  // Formatar histórico para enviar ao Gemini
  const history = recentMessages
    .filter(m => m.id !== userMsg.id) // excluir a última mensagem que está sendo enviada separada no prompt
    .map(m => {
      let textContent = m.content;
      // Se for a IA e ela retornou JSON, enviar a explicação como conteúdo legível para manter a coerência
      if (m.role === "assistant") {
        try {
          const parsed = JSON.parse(m.content);
          textContent = parsed.explanation || m.content;
        } catch {
          textContent = m.content;
        }
      }
      return {
        role: m.role as "user" | "model",
        parts: [textContent]
      };
    });

  // 4. Montar contexto operacional dinâmico do banco (fornecedores, ingredientes e receitas)
  const systemContext = await buildSystemContext();
  const actionsMeta = actionRegistry.getPromptDescriptions();

  // 5. Montar prompt do sistema
  const systemPrompt = buildSystemPrompt(systemContext, actionsMeta);

  // 6. Invocar o provedor de IA com restrição de JSON
  const aiResponse = await generateStructuredResponse(finalPrompt, history, systemPrompt);

  // 7. Salvar resposta estruturada da IA no banco
  const [assistantMsg] = await db.insert(aiMessages).values({
    conversationId,
    role: "assistant",
    content: JSON.stringify(aiResponse), // Salva o JSON estruturado na íntegra
    intent: aiResponse.intent,
    parsedJson: JSON.stringify(aiResponse.extractedData)
  }).returning();

  revalidatePath("/assistente");
  return {
    userMessage: userMsg,
    assistantMessage: assistantMsg
  };
}

export async function executeConfirmAction(messageId: number) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Usuário não autenticado");

  // 1. Buscar a mensagem da IA correspondente
  const [msg] = await db.select().from(aiMessages).where(eq(aiMessages.id, messageId));
  if (!msg || msg.role !== "assistant" || !msg.intent) {
    throw new Error("Ação ou mensagem inválida para confirmação");
  }

  const extractedData = msg.parsedJson ? JSON.parse(msg.parsedJson) : null;

  // 2. Invocar o ActionExecutor
  const result = await executeAction(msg.intent, extractedData, user.id);

  // 3. Atualizar o status de sucesso e o nome da ação executada no banco
  await db
    .update(aiMessages)
    .set({
      executedAction: msg.intent,
      success: result.success
    })
    .where(eq(aiMessages.id, messageId));

  // 4. Inserir resposta do sistema no chat confirmando a operação
  const confirmationResponse: AIResponse = {
    intent: null,
    confidence: 100,
    needsConfirmation: false,
    missingFields: [],
    warnings: [],
    extractedData: null,
    explanation: result.success 
      ? `✅ Operação confirmada! ${result.message}`
      : `❌ Falha ao executar: ${result.message}`
  };

  await db.insert(aiMessages).values({
    conversationId: msg.conversationId,
    role: "assistant",
    content: JSON.stringify(confirmationResponse),
  });

  revalidatePath("/assistente");
  return result;
}

export async function executeCancelAction(messageId: number) {
  const [msg] = await db.select().from(aiMessages).where(eq(aiMessages.id, messageId));
  if (!msg) throw new Error("Mensagem não encontrada");

  const cancellationResponse: AIResponse = {
    intent: null,
    confidence: 100,
    needsConfirmation: false,
    missingFields: [],
    warnings: [],
    extractedData: null,
    explanation: "🚫 Ação cancelada pelo usuário."
  };

  await db.insert(aiMessages).values({
    conversationId: msg.conversationId,
    role: "assistant",
    content: JSON.stringify(cancellationResponse)
  });

  revalidatePath("/assistente");
}
